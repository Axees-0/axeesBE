#!/usr/bin/env node

/**
 * SEED SAMPLE INFLUENCER DATA
 * Creates realistic Racing/Motorsports influencers for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const SAMPLE_INFLUENCERS = [
  {
    name: "Alex Thunder",
    userName: "alexthunder",
    email: "alex@racing.com", 
    bio: "Professional drift racer and automotive content creator. Sharing the thrill of motorsports with 500K+ followers.",
    userType: "Creator",
    status: "active",
    isActive: true,
    mainPlatform: "instagram",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    tags: ["Racing", "Drifting", "Motorsports"],
    creatorData: {
      handleName: "@alexthunder",
      categories: ["Racing", "Drifting", "Motorsports"],
      nicheTopics: ["Drift Racing", "Track Days", "Car Culture"],
      platforms: [
        { platform: "instagram", handle: "alexthunder", followersCount: 520000 },
        { platform: "youtube", handle: "AlexThunderRacing", followersCount: 180000 },
        { platform: "tiktok", handle: "alexthunder", followersCount: 750000 }
      ],
      totalFollowers: 1450000,
      funFact: "Has won 15 professional drift competitions",
      achievements: "2023 Drift Championship Winner, Featured in Motor Trend",
      businessVentures: "Thunder Racing Garage, Custom Car Builds",
      mostViewedTitle: "Epic 1000HP Drift Battle - 2.5M Views"
    }
  },
  {
    name: "Maria Speedster",
    userName: "mariaspeedster",
    email: "maria@speedster.com",
    bio: "Formula racing driver and track day enthusiast. Breaking barriers in motorsports one lap at a time.",
    userType: "Creator", 
    status: "active",
    isActive: true,
    mainPlatform: "youtube",
    avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=400&h=400&fit=crop&crop=face",
    tags: ["Racing", "Speed", "Track Days"],
    creatorData: {
      handleName: "@mariaspeedster",
      categories: ["Racing", "Speed", "Track Days"],
      nicheTopics: ["Formula Racing", "Track Performance", "Women in Motorsports"],
      platforms: [
        { platform: "youtube", handle: "MariaSpeedster", followersCount: 420000 },
        { platform: "instagram", handle: "mariaspeedster", followersCount: 280000 },
        { platform: "twitter", handle: "mariaspeedster", followersCount: 95000 }
      ],
      totalFollowers: 795000,
      funFact: "First woman to break track record at Silverstone in amateur category",
      achievements: "Regional Racing Champion 2022, Safety Advocate",
      businessVentures: "Speedster Racing Academy, Women in Racing Initiative",
      mostViewedTitle: "My First Time Driving a Formula Car - 1.8M Views"
    }
  },
  {
    name: "Jake Motors",
    userName: "jakemotors",
    email: "jake@motors.com",
    bio: "Car reviewer and motorsports analyst. Testing everything from supercars to track-day specials.",
    userType: "Creator",
    status: "active", 
    isActive: true,
    mainPlatform: "youtube",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", 
    tags: ["Car Reviews", "Motorsports", "Automotive"],
    creatorData: {
      handleName: "@jakemotors",
      categories: ["Car Reviews", "Motorsports", "Automotive"],
      nicheTopics: ["Car Reviews", "Performance Testing", "Track Analysis"],
      platforms: [
        { platform: "youtube", handle: "JakeMotorsTV", followersCount: 890000 },
        { platform: "instagram", handle: "jakemotors", followersCount: 320000 },
        { platform: "facebook", handle: "JakeMotorsOfficial", followersCount: 150000 }
      ],
      totalFollowers: 1360000,
      funFact: "Has reviewed over 300 cars in the last 3 years",
      achievements: "Automotive Journalist of the Year 2023, 100M+ video views",
      businessVentures: "Motors Media Group, Car Testing Services",
      mostViewedTitle: "Lamborghini vs McLaren: Ultimate Track Battle - 3.2M Views"
    }
  },
  {
    name: "Riley Track",
    userName: "rileytrack",
    email: "riley@track.com",
    bio: "Track day instructor and racing coach. Helping drivers unlock their potential on the circuit.", 
    userType: "Creator",
    status: "active",
    isActive: true,
    mainPlatform: "instagram",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    tags: ["Track Days", "Racing", "Motorsports"],
    creatorData: {
      handleName: "@rileytrack",
      categories: ["Track Days", "Racing", "Motorsports"],
      nicheTopics: ["Track Instruction", "Racing Techniques", "Driver Development"],
      platforms: [
        { platform: "instagram", handle: "rileytrack", followersCount: 185000 },
        { platform: "youtube", handle: "RileyTrackCoach", followersCount: 95000 },
        { platform: "tiktok", handle: "rileytrack", followersCount: 220000 }
      ],
      totalFollowers: 500000,
      funFact: "Has trained over 1000 drivers at track days",
      achievements: "Certified Racing Instructor, 15 years track experience",
      businessVentures: "Track Academy, Performance Driving Courses",
      mostViewedTitle: "How to Take the Perfect Racing Line - 950K Views"
    }
  },
  {
    name: "Carlos Drift",
    userName: "carlosdrift",
    email: "carlos@drift.com",
    bio: "Professional drifter and car builder. Bringing you the sideways lifestyle and custom builds.",
    userType: "Creator",
    status: "active",
    isActive: true, 
    mainPlatform: "tiktok",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    tags: ["Drifting", "Car Culture", "Racing"],
    creatorData: {
      handleName: "@carlosdrift",
      categories: ["Drifting", "Car Culture", "Racing"],
      nicheTopics: ["Drift Culture", "Car Builds", "Sideways Action"],
      platforms: [
        { platform: "tiktok", handle: "carlosdrift", followersCount: 1200000 },
        { platform: "instagram", handle: "carlosdrift", followersCount: 380000 },
        { platform: "youtube", handle: "CarlosDriftTV", followersCount: 240000 }
      ],
      totalFollowers: 1820000,
      funFact: "Built his first drift car at age 16",
      achievements: "3x Drift Championship Winner, Custom Build Specialist",
      businessVentures: "Drift Garage, Custom Performance Parts",
      mostViewedTitle: "Building the Ultimate Drift Car in 24 Hours - 4.1M Views"
    }
  },
  {
    name: "Sam Autocross",
    userName: "samautocross",
    email: "sam@autocross.com",
    bio: "Autocross champion and precision driving expert. Mastering the art of speed and control.",
    userType: "Creator",
    status: "active",
    isActive: true,
    mainPlatform: "youtube",
    avatarUrl: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face",
    tags: ["Autocross", "Racing", "Speed"],
    creatorData: {
      handleName: "@samautocross", 
      categories: ["Autocross", "Racing", "Speed"],
      nicheTopics: ["Autocross Racing", "Precision Driving", "Car Setup"],
      platforms: [
        { platform: "youtube", handle: "SamAutocrossTV", followersCount: 165000 },
        { platform: "instagram", handle: "samautocross", followersCount: 120000 },
        { platform: "facebook", handle: "SamAutocrossRacing", followersCount: 75000 }
      ],
      totalFollowers: 360000,
      funFact: "Holds regional autocross lap record at 5 different tracks",
      achievements: "National Autocross Champion 2022, Setup Specialist",
      businessVentures: "Autocross Academy, Performance Consulting",
      mostViewedTitle: "Perfect Autocross Run Breakdown - 680K Views"
    }
  }
];

async function seedInfluencers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing creators for fresh start
    console.log('🧹 Clearing existing Creator users...');
    await User.deleteMany({ userType: 'Creator' });

    // Insert sample influencers
    console.log('📝 Creating sample influencers...');
    const created = await User.insertMany(SAMPLE_INFLUENCERS);
    
    console.log(`✅ Successfully created ${created.length} sample influencers:`);
    created.forEach(user => {
      console.log(`   - ${user.name} (@${user.userName}) - ${user.creatorData.totalFollowers.toLocaleString()} followers`);
    });

    // Verify the data
    console.log('\n🔍 Verifying search results...');
    const searchResults = await User.find({ 
      status: 'active', 
      userType: 'Creator' 
    }).limit(3);
    
    console.log(`✅ Found ${searchResults.length} active creators in database`);
    
    console.log('\n🎯 Sample search results:');
    searchResults.forEach(user => {
      console.log(`   - ${user.name}: ${user.creatorData.categories.join(', ')}`);
    });

    console.log('\n✅ Database seeding complete! Ready for testing.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedInfluencers().then(() => {
    console.log('\n🚀 You can now run: node test-success.js');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { seedInfluencers, SAMPLE_INFLUENCERS };