//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
});

const itemSchema = {
  name: {
    type: String,
    required: true,
  },
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todo-list",
});
const item2 = new Item({
  name: "Click the checkbox to delete an item",
});
const item3 = new Item({
  name: "Add a new item by entering text below",
});

const items = [item1, item2, item3];

const listSchema = {
  name: {
    type: String,
    required: true,
  },
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  const day = date.getDate();
  Item.find((err, item) => {
    if (item.length === 0) {
      Item.insertMany(items, (err) => {
        console.log("success");
      });
    } else {
      res.render("list", { listTitle: day, newListItems: item });
    }
  });
});

app.post("/", function (req, res) {
  const item = new Item({ name: req.body.newItem });
  const listName = req.body.list;

  List.findOne({ name: listName }, (err, foundList) => {
    if (!foundList) {
      item.save();
      res.redirect("/");
    } else {
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    }
  });
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = _.capitalize(req.body.listName);

  if (listName === date.getDate()) {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err) => {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/:list", (req, res) => {
  const listName = _.capitalize(req.params.list);
  List.findOne({ name: req.params.list }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        console.log("no list found");
        const list = new List({
          name: req.params.list,
          items: items,
        });
        list.save();
        res.redirect(`/${listName}`);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
