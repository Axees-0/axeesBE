#!/usr/bin/env node

/**
 * Demo Deal Creation Script
 * Creates sample deals to test the deals page functionality
 */

const mongoose = require('mongoose');
const Deal = require('./models/deal');
const User = require('./models/User');

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/axees-dev';

async function createDemoDeals() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // First, let's create some demo users if they don't exist
        const demoUsers = await createDemoUsers();
        
        // Now create demo deals
        await createDeals(demoUsers);
        
        console.log('\n🎉 Demo deals creation completed!');
        console.log('📱 View them at: http://localhost:8082/deals');
        
    } catch (error) {
        console.error('❌ Error creating demo deals:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

async function createDemoUsers() {
    console.log('👥 Creating demo users...');
    
    const demoUsersData = [
        {
            email: 'marketer1@demo.com',
            phone: '+15551234567',
            name: 'Sarah Marketing',
            userName: 'sarahm_demo',
            userType: 'Marketer',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b1dc?w=150&h=150&fit=crop&crop=face',
            marketerData: {
                brandName: 'Digital Boost Agency',
                industry: 'Fashion & Beauty',
                brandDescription: 'We help fashion brands reach millennial audiences through authentic creator partnerships.',
                categories: ['Fashion', 'Beauty', 'Lifestyle'],
                totalFollowers: 0,
                offers: 0,
                deals: 0
            }
        },
        {
            email: 'creator1@demo.com',
            phone: '+15559876543',
            name: 'Alex Content',
            userName: 'alexcreates',
            userType: 'Creator',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            creatorData: {
                handleName: '@alexcreates',
                nicheTopics: ['Fashion', 'Lifestyle', 'Beauty'],
                categories: ['Fashion', 'Beauty'],
                platforms: [
                    { platform: 'instagram', handle: '@alexcreates', followersCount: 45000 },
                    { platform: 'tiktok', handle: '@alexcreates', followersCount: 23000 }
                ],
                totalFollowers: 68000
            }
        },
        {
            email: 'creator2@demo.com',
            phone: '+15551122334',
            name: 'Jordan Tech',
            userName: 'jordantech',
            userType: 'Creator',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            creatorData: {
                handleName: '@jordantech',
                nicheTopics: ['Technology', 'Gaming', 'Reviews'],
                categories: ['Tech', 'Gaming'],
                platforms: [
                    { platform: 'youtube', handle: '@jordantech', followersCount: 125000 },
                    { platform: 'twitter', handle: '@jordantech', followersCount: 15000 }
                ],
                totalFollowers: 140000
            }
        },
        {
            email: 'creator3@demo.com',
            phone: '+15554455667',
            name: 'Maya Fitness',
            userName: 'mayafit',
            userType: 'Creator',
            avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            creatorData: {
                handleName: '@mayafit',
                nicheTopics: ['Fitness', 'Health', 'Wellness'],
                categories: ['Fitness', 'Health'],
                platforms: [
                    { platform: 'instagram', handle: '@mayafit', followersCount: 78000 },
                    { platform: 'youtube', handle: '@mayafit', followersCount: 32000 }
                ],
                totalFollowers: 110000
            }
        }
    ];

    const createdUsers = [];
    
    for (const userData of demoUsersData) {
        let user = await User.findOne({ email: userData.email });
        
        if (!user) {
            user = new User(userData);
            await user.save();
            console.log(`✅ Created user: ${userData.name} (${userData.userType})`);
        } else {
            console.log(`ℹ️ User already exists: ${userData.name}`);
        }
        
        createdUsers.push(user);
    }
    
    return createdUsers;
}

async function createDeals(users) {
    console.log('\n📋 Creating demo deals...');
    
    const marketer = users.find(u => u.userType === 'Marketer');
    const creators = users.filter(u => u.userType === 'Creator');
    
    const dealTemplates = [
        {
            dealName: 'Summer Fashion Campaign - Instagram Posts',
            platforms: ['instagram'],
            deliverables: ['3 Instagram Posts', '5 Instagram Stories', 'Product Styling'],
            status: 'Active',
            paymentAmount: 2500,
            description: 'Create engaging summer fashion content featuring our new collection',
            creator: creators[0]
        },
        {
            dealName: 'Tech Product Review - YouTube Video',
            platforms: ['youtube'],
            deliverables: ['1 YouTube Review Video', '3 Short-form Videos', 'Unboxing Content'],
            status: 'In Progress',
            paymentAmount: 5000,
            description: 'Comprehensive review of our latest smartphone with honest opinions',
            creator: creators[1]
        },
        {
            dealName: 'Fitness App Promotion - Multi-platform',
            platforms: ['instagram', 'youtube'],
            deliverables: ['2 Workout Videos', '1 App Demo', '5 Progress Posts'],
            status: 'Completed',
            paymentAmount: 3500,
            description: 'Showcase our fitness app through authentic workout content',
            creator: creators[2]
        },
        {
            dealName: 'Brand Awareness Campaign - TikTok',
            platforms: ['tiktok'],
            deliverables: ['5 TikTok Videos', '3 Trend Adaptations', 'Behind-the-scenes Content'],
            status: 'Pending Approval',
            paymentAmount: 1800,
            description: 'Fun and engaging TikTok content to increase brand awareness',
            creator: creators[0]
        },
        {
            dealName: 'Product Launch - Cross-platform Campaign',
            platforms: ['instagram', 'youtube', 'twitter'],
            deliverables: ['Launch Announcement', 'Product Demo', '7 Social Posts', 'Live Q&A'],
            status: 'Active',
            paymentAmount: 7500,
            description: 'Comprehensive product launch campaign across multiple platforms',
            creator: creators[1]
        }
    ];

    let dealNumber = 1000;
    
    for (const template of dealTemplates) {
        // Check if deal already exists
        const existingDeal = await Deal.findOne({ dealName: template.dealName });
        
        if (!existingDeal) {
            const deal = new Deal({
                dealName: template.dealName,
                dealNumber: `DEAL-${dealNumber++}`,
                marketerId: marketer._id,
                creatorId: template.creator._id,
                platforms: template.platforms,
                deliverables: template.deliverables,
                status: template.status,
                paymentInfo: {
                    currency: 'USD',
                    paymentAmount: template.paymentAmount,
                    paymentStatus: template.status === 'Completed' ? 'Paid' : 'Pending',
                    requiredPayment: template.paymentAmount * 0.5 // 50% upfront
                },
                desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                milestones: [
                    {
                        name: 'Content Creation',
                        amount: template.paymentAmount * 0.6,
                        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                        description: 'Create and submit initial content for review',
                        status: template.status === 'Completed' ? 'completed' : 'pending',
                        createdBy: marketer._id
                    },
                    {
                        name: 'Content Publishing',
                        amount: template.paymentAmount * 0.4,
                        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                        description: 'Publish approved content and provide analytics',
                        status: 'pending',
                        createdBy: marketer._id
                    }
                ]
            });

            await deal.save();
            console.log(`✅ Created deal: ${template.dealName} ($${template.paymentAmount})`);
        } else {
            console.log(`ℹ️ Deal already exists: ${template.dealName}`);
        }
    }
}

// Run the script
if (require.main === module) {
    createDemoDeals().catch(console.error);
}

module.exports = { createDemoDeals };