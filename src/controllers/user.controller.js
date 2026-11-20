import User from "../models/user.model.js";

const sanitizeUser = (user) => ({
  _id: user._id?.toString() || user.id,
  name: user.name || "Unnamed Customer",
  email: user.email || "",
  image: user.image || "",
  role: user.role || "customer",
  isBlocked: Boolean(user.isBlocked),
  phone: user.phone || "",
  createdAt: user.createdAt || null,
  updatedAt: user.updatedAt || null,
});

// Get all registered customers (Admin)
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers.map(sanitizeUser),
    });
  } catch (error) {
    console.error("Get customers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers.",
    });
  }
};

// Get a single customer's details (Admin)
export const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeUser(customer),
    });
  } catch (error) {
    const statusCode = error.name === "CastError" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? "Invalid customer ID."
          : "Failed to fetch customer.",
    });
  }
};

const setBlockedState = async (req, res, isBlocked) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be blocked.",
      });
    }

    user.isBlocked = isBlocked;
    await user.save();

    return res.status(200).json({
      success: true,
      message: isBlocked
        ? "Customer blocked successfully."
        : "Customer unblocked successfully.",
      data: sanitizeUser(user),
    });
  } catch (error) {
    const statusCode = error.name === "CastError" ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? "Invalid customer ID."
          : "Failed to update customer.",
    });
  }
};

// Block a customer (Admin)
export const blockCustomer = (req, res) =>
  setBlockedState(req, res, true);

// Unblock a customer (Admin)
export const unblockCustomer = (req, res) =>
  setBlockedState(req, res, false);
