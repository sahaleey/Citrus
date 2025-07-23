import Food from "../models/Food.js";

// GET /api/foods
export const getFoods = async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch foods" });
  }
};

// ✅ POST /api/foods
export const addFood = async (req, res) => {
  const {
    name,
    price,
    quantityAvailable,
    offer,
    image,
    description,
    type,
    category,
  } = req.body;

  if (
    !name ||
    !price ||
    !quantityAvailable ||
    !image ||
    !description ||
    !category ||
    !type
  ) {
    return res.status(400).json({ error: "Missing required food fields" });
  }

  try {
    const newFood = await Food.create({
      name,
      price,
      quantityAvailable,
      offer,
      image,
      description,
      category,
      type,
    });
    res.status(201).json({ message: "Food added successfully", food: newFood });
  } catch (err) {
    console.error("Add food error:", err);
    res.status(500).json({ error: "Failed to add food" });
  }
};

// DELETE /api/foods/:id
export const deleteFood = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Food.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Food item not found" });
    }
    res.json({ message: "Food deleted successfully" });
  } catch (err) {
    console.error("Delete food error:", err);
    res.status(500).json({ error: "Failed to delete food" });
  }
};
