// seedData.js
require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const User = require("../models/User"); // Adjust path as needed

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGO_URI + "AxeesDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected!");
    try {
      await seedDatabase();
      console.log("Seeding completed successfully!");
    } catch (err) {
      console.error("Seeding error:", err);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

/** Predefined possible platforms. */
const ALL_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "facebook",
  "other",
];

/** Random sub-doc array for platforms */
function generateRandomPlatforms() {
  const num = faker.number.int({ min: 2, max: 4 });
  const selected = faker.helpers.arrayElements(ALL_PLATFORMS, num);

  return selected.map((plat) => ({
    platform: plat,
    handle: `@${faker.word.noun()}_${plat}`,
    followersCount: faker.number.int({ min: 1000, max: 2_000_000 }),
  }));
}

/** Achievements or business ventures */
function generateRandomStringsArray(count = 2) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(faker.company.catchPhrase());
  }
  return arr;
}

/** Generate random array of categories */
function generateRandomCategories() {
  const catPool = [
    "Entertainment",
    "Car Enthusiast",
    "Food",
    "Finance",
    "Art",
    "DIY",
    "Beauty",
  ];
  const num = faker.number.int({ min: 1, max: 3 });
  return faker.helpers.arrayElements(catPool, num);
}

/**
 * Create a single fake Creator doc
 */
function createFakeCreator(i) {
  const phone = `+1 555-55${faker.number.int({ min: 10, max: 99 })}-9${i}`;
  const fullName = faker.person.fullName();
  const userName = `@${faker.internet.userName(fullName).toLowerCase()}`;

  return {
    phone,
    email: faker.internet.email(),
    password: faker.internet.password(),
    name: fullName,
    userName,
    bio: faker.lorem.sentence(),
    link: faker.internet.url(),
    tags: faker.helpers.arrayElements(
      ["cars", "memes", "vlogs", "gaming", "tech"],
      2
    ),
    avatarUrl: faker.image.urlPicsumPhotos({ width: 200, height: 200 }),

    userType: "Creator",
    isActive: true,
    status: "active",

    creatorData: {
      handleName: userName,
      nicheTopics: faker.helpers.arrayElements(
        ["entertainment", "car", "food", "finance"],
        2
      ),
      categories: generateRandomCategories(),
      platforms: generateRandomPlatforms(),

      // "stats"
      totalFollowers: faker.number.int({ min: 1000, max: 1_000_000 }),
      listedEvents: faker.number.int({ min: 10, max: 500 }),
      combinedViews: faker.number.int({ min: 100000, max: 9000000 }),
      offers: faker.number.int({ min: 0, max: 999 }),
      deals: faker.number.int({ min: 0, max: 1000 }),
      profileViews: faker.number.int({ min: 1000, max: 500000 }),

      achievements: generateRandomStringsArray(2),
      businessVentures: generateRandomStringsArray(2),
    },
    marketerData: null,
  };
}

/**
 * Create a single fake Marketer doc
 */
function createFakeMarketer(i) {
  const phone = `+1 666-66${faker.number.int({ min: 10, max: 99 })}-7${i}`;
  const fullName = faker.person.fullName();
  const userName = `@${faker.internet.userName(fullName).toLowerCase()}`;

  return {
    phone,
    email: faker.internet.email(),
    password: faker.internet.password(),
    name: fullName,
    userName,
    bio: faker.lorem.sentence(),
    link: faker.internet.url(),
    tags: faker.helpers.arrayElements(["marketing", "branding", "finance"], 2),
    avatarUrl: faker.image.urlPicsumPhotos({ width: 200, height: 200 }),

    userType: "Marketer",
    isActive: true,
    status: "active",

    creatorData: null,
    marketerData: {
      brandName: faker.company.name(),
      brandWebsite: faker.internet.url(),
      brandDescription: faker.company.catchPhrase(),
      industry: faker.helpers.arrayElement([
        "Automotive",
        "Food & Beverage",
        "Retail",
        "Software",
        "Gaming",
      ]),
      budget: faker.number.int({ min: 1000, max: 1_000_000 }),
      // unify "offers" / "deals" naming if you want:
      offers: faker.number.int({ min: 0, max: 500 }),
      deals: faker.number.int({ min: 0, max: 300 }),

      // or keep old fields
      offersCount: faker.number.int({ min: 0, max: 500 }),
      dealsCompleted: faker.number.int({ min: 0, max: 100 }),
    },
  };
}

/**
 * Main function: Generate 10 Creators + 10 Marketers and insert into DB
 */
async function seedDatabase() {
  // OPTIONAL: Clear out old data
  // await User.deleteMany({});

  const users = [];
  for (let i = 0; i < 10; i++) {
    users.push(createFakeCreator(i));
    users.push(createFakeMarketer(i));
  }

  const result = await User.insertMany(users);
  console.log(`Inserted ${result.length} user docs into DB.`);
}
