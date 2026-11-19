
import dotenv from "dotenv";
import dns from "node:dns";
import mongoose from "mongoose";
import Service from "../src/models/service.model.js";

dotenv.config();

// Use Google DNS resolvers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const services = [
  {
    serviceName: "Luxury Facial",
    category: "Skin Care",
    description: "A relaxing facial treatment for refreshed and glowing skin.",
    price: 1200,
    duration: 60,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=85",
    status: "active",
  },
  {
    serviceName: "Bridal Makeup",
    category: "Makeup",
    description: "Professional bridal makeup for your most special day.",
    price: 3500,
    duration: 120,
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=85",
    status: "active",
  },
  {
    serviceName: "Manicure & Pedicure",
    category: "Nail Care",
    description: "Complete nail care for clean and beautiful hands and feet.",
    price: 900,
    duration: 75,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=85",
    status: "active",
  },
  {
    serviceName: "Hair Spa",
    category: "Hair Care",
    description: "A nourishing hair treatment for soft and healthy hair.",
    price: 1500,
    duration: 60,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=85",
    status: "active",
  },
  {
    serviceName: "Deep Cleansing Facial",
    category: "Skin Care",
    description: "A deep cleansing facial treatment for a fresh skin experience.",
    price: 1000,
    duration: 50,
    image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=85",
    status: "active",
  },
];

const seedServices = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected.");

    let added = 0;
    let skipped = 0;

    for (const service of services) {
      const result = await Service.updateOne(
        { serviceName: service.serviceName },
        { $setOnInsert: service },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        added++;
        console.log(`Added: ${service.serviceName}`);
      } else {
        skipped++;
        console.log(`Already exists: ${service.serviceName}`);
      }
    }

    console.log("\nSeed completed!");
    console.log(`New services added: ${added}`);
    console.log(`Existing services skipped: ${skipped}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedServices();
