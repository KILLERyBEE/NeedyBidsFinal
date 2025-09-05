const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ac = require("../models/Electronics/ac");
const accessories = require("../models/Electronics/accessories");
const cameras = require("../models/Electronics/cameras");
const computers = require("../models/Electronics/computers");
const fridge = require("../models/Electronics/fridge");
const games = require("../models/Electronics/games");
const kitchen = require("../models/Electronics/kitchen");   
const tv = require("../models/Electronics/tv")
const kids = require("../models/Fashion/kids");
const men = require("../models/Fashion/men")
const women = require("../models/Fashion/women")
const beds = require("../models/Furniture/beds")
const decor = require("../models/Furniture/decor")
const kids_furniture = require("../models/Furniture/kids-furniture")
const others = require("../models/Furniture/others")
const sofa = require("../models/Furniture/sofa")
const mobileAccessories = require("../models/Mobilees/mobileAccessories")
const mobiles = require("../models/Mobilees/mobiles")
const tablets = require("../models/Mobilees/tablets")
const aquarium = require("../models/Pets/aquarium")
const books_sports = require("../models/Pets/books-sports")
const pet_accessories = require("../models/Pets/pet-accessories")
const homes = require("../models/Property/homes")
const lands = require("../models/Property/lands")
const office = require("../models/Property/office")
const shops = require("../models/Property/shops")
const aftermarket = require("../models/Spare/aftermarket")
const original = require("../models/Spare/original")
const bicycles = require("../models/Vehicles/bicycles")
const bikes = require("../models/Vehicles/bikes")
const cars = require("../models/Vehicles/cars")
const commercial_vehicles = require("../models/Vehicles/commericial-vehicles")
const scooters = require("../models/Vehicles/scooters")

router.get("/seller-dashboard/:id", async (req, res) => {
  const sellerId = req.params.id;
  try {
    // Find all items for this seller in each model
    const [acItems, accessoriesItems, camerasItems, computersItems, fridgeItems, gamesItems, kitchenItems, tvItems, kidsItems, menItems, womenItems, bedsItems, decorItems, kids_furnitureItems, othersItems, sofaItems, mobileAccessoriesItems, mobilesItems, tabletsItems, aquariumItems, books_sportsItems, pet_accessoriesItems, homesItems, landsItems, officeItems, shopsItems, aftermarketItems, originalItems, bicyclesItems, bikesItems, carsItems, commercial_vehiclesItems, scootersItems] = await Promise.all([
      ac.find({ userid: sellerId }),
      accessories.find({ userid: sellerId }),
      cameras.find({ userid: sellerId }),
      computers.find({ userid: sellerId }),
      fridge.find({ userid: sellerId }),
      games.find({ userid: sellerId }),
      kitchen.find({ userid: sellerId }),
      tv.find({ userid: sellerId }),
      kids.find({ userid: sellerId }),
      men.find({ userid: sellerId }),
      women.find({ userid: sellerId }),
      beds.find({ userid: sellerId }),
      decor.find({ userid: sellerId }),
      kids_furniture.find({ userid: sellerId }),
      others.find({ userid: sellerId }),
      sofa.find({ userid: sellerId }),
      mobileAccessories.find({ userid: sellerId }),
      mobiles.find({ userid: sellerId }),
      tablets.find({ userid: sellerId }),
      aquarium.find({ userid: sellerId }),
      books_sports.find({ userid: sellerId }),
      pet_accessories.find({ userid: sellerId }),
      homes.find({ userid: sellerId }),
      lands.find({ userid: sellerId }),
      office.find({ userid: sellerId }),
      shops.find({ userid: sellerId }),
      aftermarket.find({ userid: sellerId }),
      original.find({ userid: sellerId }),
      bicycles.find({ userid: sellerId }),
      bikes.find({ userid: sellerId }),
      cars.find({ userid: sellerId }),
      commercial_vehicles.find({ userid: sellerId }),
      scooters.find({ userid: sellerId })
    ]);
    res.json({
      ac: acItems,
      accessories: accessoriesItems,
      cameras: camerasItems,
      computers: computersItems,
      fridge: fridgeItems,
      games: gamesItems,
      kitchen: kitchenItems,
      tv: tvItems,
      kids: kidsItems,
      men: menItems,
      women: womenItems,
      beds: bedsItems,
      decor: decorItems,
      kids_furniture: kids_furnitureItems,
      others: othersItems,
      sofa: sofaItems,
      mobileAccessories: mobileAccessoriesItems,
      mobiles: mobilesItems,
      tablets: tabletsItems,
      aquarium: aquariumItems,
      books_sports: books_sportsItems,
      pet_accessories: pet_accessoriesItems,
      homes: homesItems,
      lands: landsItems,
      office: officeItems,
      shops: shopsItems,
      aftermarket: aftermarketItems,
      original: originalItems,
      bicycles: bicyclesItems,
      bikes: bikesItems,
      cars: carsItems,
      commercial_vehicles: commercial_vehiclesItems,
      scooters: scootersItems
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch seller items" });
  }
});
const mongoose = require("mongoose");
router.get("/sellerDashboard/:id", async (req, res) => {
  let sellerId = req.params.id;
  if (sellerId.startsWith(":")) sellerId = sellerId.slice(1);
  sellerId = sellerId.trim();
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).send("Invalid seller ID");
  }
  try {
    const [
      acItems, accessoriesItems, camerasItems, computersItems, fridgeItems, gamesItems, kitchenItems, tvItems,
      kidsItems, menItems, womenItems, bedsItems, decorItems, kids_furnitureItems, othersItems, sofaItems,
      mobileAccessoriesItems, mobilesItems, tabletsItems, aquariumItems, books_sportsItems, pet_accessoriesItems,
      homesItems, landsItems, officeItems, shopsItems, aftermarketItems, originalItems, bicyclesItems, bikesItems,
      carsItems, commercial_vehiclesItems, scootersItems
    ] = await Promise.all([
      ac.find({ userid: sellerId }),
      accessories.find({ userid: sellerId }),
      cameras.find({ userid: sellerId }),
      computers.find({ userid: sellerId }),
      fridge.find({ userid: sellerId }),
      games.find({ userid: sellerId }),
      kitchen.find({ userid: sellerId }),
      tv.find({ userid: sellerId }),
      kids.find({ userid: sellerId }),
      men.find({ userid: sellerId }),
      women.find({ userid: sellerId }),
      beds.find({ userid: sellerId }),
      decor.find({ userid: sellerId }),
      kids_furniture.find({ userid: sellerId }),
      others.find({ userid: sellerId }),
      sofa.find({ userid: sellerId }),
      mobileAccessories.find({ userid: sellerId }),
      mobiles.find({ userid: sellerId }),
      tablets.find({ userid: sellerId }),
      aquarium.find({ userid: sellerId }),
      books_sports.find({ userid: sellerId }),
      pet_accessories.find({ userid: sellerId }),
      homes.find({ userid: sellerId }),
      lands.find({ userid: sellerId }),
      office.find({ userid: sellerId }),
      shops.find({ userid: sellerId }),
      aftermarket.find({ userid: sellerId }),
      original.find({ userid: sellerId }),
      bicycles.find({ userid: sellerId }),
      bikes.find({ userid: sellerId }),
      cars.find({ userid: sellerId }),
      commercial_vehicles.find({ userid: sellerId }),
      scooters.find({ userid: sellerId })
    ]);
    const sellerItems = {
      ac: acItems,
      accessories: accessoriesItems,
      cameras: camerasItems,
      computers: computersItems,
      fridge: fridgeItems,
      games: gamesItems,
      kitchen: kitchenItems,
      tv: tvItems,
      kids: kidsItems,
      men: menItems,
      women: womenItems,
      beds: bedsItems,
      decor: decorItems,
      kids_furniture: kids_furnitureItems,
      others: othersItems,
      sofa: sofaItems,
      mobileAccessories: mobileAccessoriesItems,
      mobiles: mobilesItems,
      tablets: tabletsItems,
      aquarium: aquariumItems,
      books_sports: books_sportsItems,
      pet_accessories: pet_accessoriesItems,
      homes: homesItems,
      lands: landsItems,
      office: officeItems,
      shops: shopsItems,
      aftermarket: aftermarketItems,
      original: originalItems,
      bicycles: bicyclesItems,
      bikes: bikesItems,
      cars: carsItems,
      commercial_vehicles: commercial_vehiclesItems,
      scooters: scootersItems
    };
    res.render("sellerdashboard", { sellerItems });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch seller items");
  }
});

router.post('/sellerDashboard/delete/:category/:itemId', async (req, res) => {
  const { category, itemId } = req.params;
  const models = {
    ac, accessories, cameras, computers, fridge, games, kitchen, tv,
    kids, men, women, beds, decor, kids_furniture, others, sofa,
    mobileAccessories, mobiles, tablets, aquarium, books_sports, pet_accessories,
    homes, lands, office, shops, aftermarket, original, bicycles, bikes,
    cars, commercial_vehicles, scooters
  };
  const Model = models[category];
  if (!Model) return res.status(400).json({ error: 'Invalid category' });
  try {
    await Model.findByIdAndDelete(itemId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
