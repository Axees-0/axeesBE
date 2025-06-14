// This file contains comprehensive service mocks for all external dependencies
// These mocks ensure tests run in isolation without making actual API calls

// Only define mocks when running in Jest environment
if (typeof jest !== 'undefined') {

// Mock Stripe payment service
jest.mock('stripe', () => {
  const stripeMocks = require('./stripeMocks');
  return jest.fn(() => stripeMocks);
});

// Mock Twilio SMS service
jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'SM1234567890abcdef1234567890abcdef',
        status: 'sent',
        to: '+12125551234',
        from: '+12125550000',
        body: 'Test message',
        dateCreated: new Date()
      })
    },
    verify: {
      v2: {
        services: jest.fn(() => ({
          verifications: {
            create: jest.fn().mockResolvedValue({
              sid: 'VE1234567890abcdef1234567890abcdef',
              status: 'pending',
              to: '+12125551234',
              channel: 'sms'
            })
          },
          verificationChecks: {
            create: jest.fn().mockResolvedValue({
              sid: 'VE1234567890abcdef1234567890abcdef',
              status: 'approved',
              to: '+12125551234',
              channel: 'sms'
            })
          }
        }))
      }
    },
    calls: {
      create: jest.fn().mockResolvedValue({
        sid: 'CA1234567890abcdef1234567890abcdef',
        status: 'initiated',
        to: '+12125551234',
        from: '+12125550000',
        direction: 'outbound-api'
      })
    }
  }));
});

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
  const mockMessaging = {
    send: jest.fn().mockResolvedValue('projects/test-project/messages/0:1234567890'),
    sendEachForMulticast: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{
        success: true,
        messageId: 'projects/test-project/messages/0:1234567890'
      }]
    }),
    sendToDevice: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      results: [{
        messageId: 'projects/test-project/messages/0:1234567890'
      }]
    }),
    subscribeToTopic: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      errors: []
    }),
    unsubscribeFromTopic: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      errors: []
    })
  };

  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'mock-doc-id',
          data: jest.fn(() => ({ field: 'value' }))
        }),
        set: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({})
      })),
      add: jest.fn().mockResolvedValue({
        id: 'mock-doc-id'
      }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        size: 1,
        docs: [{
          id: 'mock-doc-id',
          exists: true,
          data: jest.fn(() => ({ field: 'value' }))
        }]
      })
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue([])
    })),
    runTransaction: jest.fn((callback) => callback({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: jest.fn(() => ({ field: 'value' }))
      }),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }))
  };

  const mockAuth = {
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      email_verified: true
    }),
    createUser: jest.fn().mockResolvedValue({
      uid: 'new-user-id',
      email: 'newuser@example.com',
      emailVerified: false
    }),
    updateUser: jest.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com'
    }),
    deleteUser: jest.fn().mockResolvedValue(undefined),
    getUser: jest.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      emailVerified: true
    }),
    getUserByEmail: jest.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
      emailVerified: true
    }),
    createCustomToken: jest.fn().mockResolvedValue('mock-custom-token'),
    setCustomUserClaims: jest.fn().mockResolvedValue(undefined),
    revokeRefreshTokens: jest.fn().mockResolvedValue(undefined)
  };

  const mockStorage = {
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        save: jest.fn().mockResolvedValue(undefined),
        download: jest.fn().mockResolvedValue([Buffer.from('mock file content')]),
        delete: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue([true]),
        getSignedUrl: jest.fn().mockResolvedValue(['https://mock-signed-url.com']),
        getMetadata: jest.fn().mockResolvedValue([{
          name: 'mock-file.txt',
          size: 1024,
          contentType: 'text/plain'
        }])
      })),
      upload: jest.fn().mockResolvedValue([{
        name: 'uploaded-file.txt'
      }])
    }))
  };

  return {
    initializeApp: jest.fn().mockReturnValue({
      messaging: jest.fn(() => mockMessaging),
      firestore: jest.fn(() => mockFirestore),
      auth: jest.fn(() => mockAuth),
      storage: jest.fn(() => mockStorage)
    }),
    messaging: jest.fn(() => mockMessaging),
    firestore: jest.fn(() => mockFirestore),
    auth: jest.fn(() => mockAuth),
    storage: jest.fn(() => mockStorage),
    credential: {
      cert: jest.fn().mockReturnValue({}),
      applicationDefault: jest.fn().mockReturnValue({})
    },
    apps: []
  };
});

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-2),
    mget: jest.fn().mockResolvedValue([null, null]),
    mset: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn().mockResolvedValue([]),
    flushdb: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn()
  }))
}));

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://s3.amazonaws.com/bucket/key',
        ETag: '"mock-etag"',
        Bucket: 'mock-bucket',
        Key: 'mock-key'
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Body: Buffer.from('mock file content'),
        ContentType: 'text/plain'
      })
    }),
    headObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        ContentLength: 1024,
        ContentType: 'text/plain',
        LastModified: new Date()
      })
    }),
    listObjectsV2: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Contents: [],
        IsTruncated: false
      })
    })
  })),
  SES: jest.fn(() => ({
    sendEmail: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'mock-message-id'
      })
    }),
    sendTemplatedEmail: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'mock-message-id'
      })
    })
  })),
  SNS: jest.fn(() => ({
    publish: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'mock-message-id'
      })
    }),
    subscribe: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        SubscriptionArn: 'mock-subscription-arn'
      })
    })
  })),
  config: {
    update: jest.fn()
  }
}));

// Mock Nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({
      messageId: '<mock-message-id@example.com>',
      accepted: ['recipient@example.com'],
      rejected: [],
      response: '250 OK'
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn()
  })),
  createTestAccount: jest.fn().mockResolvedValue({
    user: 'test@ethereal.email',
    pass: 'test-password',
    smtp: {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false
    }
  })
}));

// Mock OpenAI (v4+ compatible with named exports)
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          object: 'chat.completion',
          created: 1677652288,
          model: 'gpt-3.5-turbo',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a mock AI response for testing.'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        })
      }
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        object: 'list',
        data: [{
          object: 'embedding',
          index: 0,
          embedding: Array(1536).fill(0.1)
        }],
        model: 'text-embedding-ada-002',
        usage: {
          prompt_tokens: 8,
          total_tokens: 8
        }
      })
    },
    moderations: {
      create: jest.fn().mockResolvedValue({
        id: 'modr-123',
        model: 'text-moderation-001',
        results: [{
          flagged: false,
          categories: {
            'sexual': false,
            'hate': false,
            'violence': false,
            'self-harm': false,
            'sexual/minors': false,
            'hate/threatening': false,
            'violence/graphic': false
          },
          category_scores: {
            'sexual': 0.01,
            'hate': 0.01,
            'violence': 0.01,
            'self-harm': 0.01,
            'sexual/minors': 0.01,
            'hate/threatening': 0.01,
            'violence/graphic': 0.01
          }
        }]
      })
    }
  }))
}));

// Mock Apify Client
jest.mock('apify-client', () => {
  return jest.fn().mockImplementation(() => ({
    actor: jest.fn(() => ({
      call: jest.fn().mockResolvedValue({
        id: 'run-123',
        status: 'SUCCEEDED'
      }),
      lastRun: jest.fn(() => ({
        dataset: jest.fn(() => ({
          listItems: jest.fn().mockResolvedValue({
            items: [
              { mock: 'data1' },
              { mock: 'data2' }
            ]
          })
        }))
      }))
    })),
    dataset: jest.fn(() => ({
      pushData: jest.fn().mockResolvedValue(undefined),
      getData: jest.fn().mockResolvedValue({
        items: []
      })
    }))
  }));
});

// Mock fs module for file operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content')),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    rmdir: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({
      size: 1024,
      isFile: () => true,
      isDirectory: () => false
    })
  }
}));

// Mock MongoDB Memory Server
jest.mock('mongodb-memory-server', () => ({
  MongoMemoryServer: {
    create: jest.fn().mockResolvedValue({
      getUri: jest.fn().mockReturnValue('mongodb://localhost:27017/test'),
      stop: jest.fn().mockResolvedValue(undefined)
    })
  }
}));

} // End Jest environment check

// Export mocked services for direct access in tests
module.exports = typeof jest !== 'undefined' ? {
  stripeMock: require('./stripeMocks'),
  twilioMock: jest.requireMock('twilio'),
  firebaseMock: jest.requireMock('firebase-admin'),
  redisMock: jest.requireMock('redis'),
  awsMock: jest.requireMock('aws-sdk'),
  nodemailerMock: jest.requireMock('nodemailer'),
  openaiMock: jest.requireMock('openai')
} : {};
