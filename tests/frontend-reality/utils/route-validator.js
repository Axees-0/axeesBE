/**
 * Route Validation Utility
 * 
 * Prevents test failures when frontend routes change.
 * Validates routes exist before running tests.
 * 
 * Critical for preventing false positives when routes are renamed/removed
 */

const config = require('../config');

class RouteValidator {
    constructor(page) {
        this.page = page;
        this.validatedRoutes = new Map();
        this.routeErrors = [];
    }

    /**
     * Validate a single route exists and is accessible
     */
    async validateRoute(route, options = {}) {
        const { 
            expectedStatus = [200, 301, 302], 
            timeout = 10000,
            requiresAuth = false 
        } = options;

        const fullUrl = `${config.frontendUrl}${route}`;
        
        // Check cache first
        if (this.validatedRoutes.has(route)) {
            return this.validatedRoutes.get(route);
        }

        try {
            console.log(`🔍 Validating route: ${route}`);
            
            const response = await this.page.goto(fullUrl, {
                waitUntil: 'networkidle2',
                timeout
            });

            const status = response.status();
            const isValid = Array.isArray(expectedStatus) 
                ? expectedStatus.includes(status)
                : status === expectedStatus;

            if (!isValid) {
                this.routeErrors.push({
                    route,
                    status,
                    error: `Unexpected status code: ${status}`,
                    requiresAuth
                });
                this.validatedRoutes.set(route, false);
                return false;
            }

            // Check if we got redirected to login (indicates auth required)
            const currentUrl = this.page.url();
            if (currentUrl.includes('/login') && !route.includes('/login')) {
                if (!requiresAuth) {
                    this.routeErrors.push({
                        route,
                        error: 'Route requires authentication but requiresAuth not set',
                        redirectedTo: currentUrl
                    });
                    this.validatedRoutes.set(route, false);
                    return false;
                }
            }

            // Check for 404 page indicators
            const is404 = await this.check404Indicators();
            if (is404) {
                this.routeErrors.push({
                    route,
                    error: 'Route returns 404 page',
                    status
                });
                this.validatedRoutes.set(route, false);
                return false;
            }

            this.validatedRoutes.set(route, true);
            console.log(`✅ Route validated: ${route}`);
            return true;

        } catch (error) {
            this.routeErrors.push({
                route,
                error: error.message,
                type: error.constructor.name
            });
            this.validatedRoutes.set(route, false);
            console.error(`❌ Route validation failed for ${route}: ${error.message}`);
            return false;
        }
    }

    /**
     * Check for common 404 page indicators
     */
    async check404Indicators() {
        const indicators = [
            // Check page title
            async () => {
                const title = await this.page.title();
                return title.toLowerCase().includes('not found') || 
                       title.includes('404');
            },
            
            // Check for 404 in page content
            async () => {
                const content = await this.page.content();
                return content.includes('404') && 
                       (content.includes('not found') || 
                        content.includes('Not Found'));
            },
            
            // Check for common 404 selectors
            async () => {
                const selectors = [
                    '[data-testid="404"]',
                    '[data-testid="not-found"]',
                    '.error-404',
                    '.not-found',
                    '#not-found'
                ];
                
                for (const selector of selectors) {
                    const element = await this.page.$(selector);
                    if (element) return true;
                }
                return false;
            }
        ];

        for (const check of indicators) {
            try {
                if (await check()) return true;
            } catch (e) {
                // Continue checking
            }
        }

        return false;
    }

    /**
     * Validate multiple routes
     */
    async validateRoutes(routes, options = {}) {
        const results = {
            valid: [],
            invalid: [],
            total: routes.length
        };

        for (const route of routes) {
            const routeConfig = typeof route === 'string' 
                ? { path: route } 
                : route;

            const isValid = await this.validateRoute(
                routeConfig.path, 
                { ...options, ...routeConfig }
            );

            if (isValid) {
                results.valid.push(routeConfig.path);
            } else {
                results.invalid.push(routeConfig.path);
            }
        }

        results.successRate = (results.valid.length / results.total * 100).toFixed(1) + '%';
        return results;
    }

    /**
     * Validate routes for a specific test module
     */
    async validateTestRoutes(testName) {
        const routeConfigs = {
            authentication: [
                { path: '/login', requiresAuth: false },
                { path: '/register', requiresAuth: false },
                { path: '/forgot-password', requiresAuth: false },
                { path: '/reset-password', requiresAuth: false },
                { path: '/logout', requiresAuth: true }
            ],
            
            forms: [
                { path: '/create-offer', requiresAuth: true },
                { path: '/profile/edit', requiresAuth: true },
                { path: '/create-campaign', requiresAuth: true },
                { path: '/submit-proof', requiresAuth: true },
                { path: '/onboarding', requiresAuth: false }
            ],
            
            chat: [
                { path: '/chat', requiresAuth: true },
                { path: '/chat/room/test', requiresAuth: true },
                { path: '/chat/room/history', requiresAuth: true }
            ],
            
            performance: [
                { path: '/', requiresAuth: false },
                { path: '/dashboard', requiresAuth: true },
                { path: '/creators', requiresAuth: false },
                { path: '/gallery', requiresAuth: false },
                { path: '/feed', requiresAuth: false }
            ],
            
            mobile: [
                { path: '/', requiresAuth: false },
                { path: '/login', requiresAuth: false },
                { path: '/profile/edit', requiresAuth: true }
            ]
        };

        const routes = routeConfigs[testName];
        if (!routes) {
            throw new Error(`Unknown test module: ${testName}`);
        }

        console.log(`\n🔍 Validating routes for ${testName} tests...`);
        const results = await this.validateRoutes(routes);
        
        if (results.invalid.length > 0) {
            console.error(`\n❌ Invalid routes found for ${testName}:`);
            results.invalid.forEach(route => {
                const error = this.routeErrors.find(e => e.route === route);
                console.error(`   - ${route}: ${error?.error || 'Unknown error'}`);
            });
            
            throw new Error(`Route validation failed for ${testName}. ${results.invalid.length} invalid routes found.`);
        }

        console.log(`✅ All ${results.valid.length} routes validated for ${testName}\n`);
        return results;
    }

    /**
     * Discover routes by crawling the frontend
     */
    async discoverRoutes(startPath = '/', maxDepth = 2) {
        const discovered = new Set();
        const toVisit = [{ path: startPath, depth: 0 }];
        const visited = new Set();

        while (toVisit.length > 0) {
            const { path, depth } = toVisit.shift();
            
            if (visited.has(path) || depth > maxDepth) continue;
            visited.add(path);

            try {
                await this.page.goto(`${config.frontendUrl}${path}`, {
                    waitUntil: 'networkidle2',
                    timeout: 10000
                });

                // Find all links on the page
                const links = await this.page.$$eval('a[href]', anchors => 
                    anchors.map(a => a.getAttribute('href'))
                        .filter(href => href && href.startsWith('/'))
                );

                for (const link of links) {
                    discovered.add(link);
                    if (!visited.has(link) && depth < maxDepth) {
                        toVisit.push({ path: link, depth: depth + 1 });
                    }
                }

            } catch (error) {
                console.warn(`Failed to discover routes from ${path}: ${error.message}`);
            }
        }

        return Array.from(discovered).sort();
    }

    /**
     * Get validation report
     */
    getReport() {
        return {
            validated: this.validatedRoutes.size,
            valid: Array.from(this.validatedRoutes.entries())
                .filter(([_, valid]) => valid)
                .map(([route]) => route),
            invalid: Array.from(this.validatedRoutes.entries())
                .filter(([_, valid]) => !valid)
                .map(([route]) => route),
            errors: this.routeErrors,
            summary: {
                total: this.validatedRoutes.size,
                passed: Array.from(this.validatedRoutes.values()).filter(v => v).length,
                failed: Array.from(this.validatedRoutes.values()).filter(v => !v).length
            }
        };
    }
}

module.exports = RouteValidator;