const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const dns = require("dns")

dns.setServers(["8.8.8.8","8.8.8.8"])
const app = express();

app.use(cors({
  origin:["*", " http://localhost:5173"],
  methods:['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders:['content-Type', 'Authorization'],
  credentials:true
}));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect("mongodb+srv://karthikvalireddy24_db_user:NPAjDjxYNGUIh4ap@cluster0.iuipagl.mongodb.net/contacts?appName=Cluster0")
  .then(() => {
    console.log("Database Connected...");
  })
  .catch((err) => {
    console.log("Database Connection Failed");
    console.log(err);
  });

// Schema
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ""
  },
  isCloseFriend: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Model
const Contact = mongoose.model("Contact", contactSchema);

// Home Route
app.get("/", (req, res) => {
  res.send("Contact Book Server Running...");
});

// GET ALL CONTACTS
app.get("/contacts", async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ADD CONTACT
app.post("/contacts", async (req, res) => {
  try {
    console.log("Received data:", req.body); // Debug log

    const contact = new Contact({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email || "",
      isCloseFriend: req.body.isCloseFriend || false
    });

    const savedContact = await contact.save();
    
    console.log("Saved contact:", savedContact); // Debug log

    res.status(201).json({
      success: true,
      data: savedContact,
      message: "Contact added successfully"
    });
  } catch (err) {
    console.error("Error saving contact:", err); // Debug log
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false,
        message: errors.join(', ') 
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
});

// UPDATE CONTACT
app.put("/contacts/:id", async (req, res) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email || "",
        isCloseFriend: req.body.isCloseFriend || false
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedContact) {
      return res.status(404).json({ 
        success: false,
        message: "Contact not found" 
      });
    }

    res.json({
      success: true,
      data: updatedContact,
      message: "Contact updated successfully"
    });
  } catch (err) {
    console.error("Error updating contact:", err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false,
        message: errors.join(', ') 
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
});

// UPDATE FAVORITE STATUS (Toggle)
app.patch("/contacts/:id/favorite", async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ 
        success: false,
        message: "Contact not found" 
      });
    }

    contact.isCloseFriend = !contact.isCloseFriend;
    const updatedContact = await contact.save();

    res.json({
      success: true,
      data: updatedContact,
      message: "Favorite status updated"
    });
  } catch (err) {
    console.error("Error toggling favorite:", err);
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
});

// DELETE CONTACT
app.delete("/contacts/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ 
        success: false,
        message: "Contact not found" 
      });
    }

    res.json({
      success: true,
      message: "Contact Deleted Successfully",
      data: contact
    });
  } catch (err) {
    console.error("Error deleting contact:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Start Server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});