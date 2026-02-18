const assert = require('assert');
const contextMatcher = require('../lib/reverse-proxy-libs/context-matcher');
const pathRewriter = require('../lib/reverse-proxy-libs/path-rewriter');
const router = require('../lib/reverse-proxy-libs/router');
const config = require('../config');

describe('config.hash', function () {
    it('returns an empty string for falsy input', function () {
        assert.strictEqual(config.hash(), '');
        assert.strictEqual(config.hash(''), '');
    });

    it('is deterministic for the same input', function () {
        const one = config.hash('password123');
        const two = config.hash('password123');
        assert.strictEqual(one, two);
    });
});

describe('context-matcher', function () {
    it('matches a single prefix path', function () {
        assert.strictEqual(contextMatcher.match('/api', '/api/v1/users'), true);
        assert.strictEqual(contextMatcher.match('/api', '/web/home'), false);
    });

    it('matches array path contexts', function () {
        assert.strictEqual(contextMatcher.match(['/web', '/api'], '/api/v1/users'), true);
        assert.strictEqual(contextMatcher.match(['/web', '/admin'], '/api/v1/users'), false);
    });

    it('matches glob paths', function () {
        assert.strictEqual(contextMatcher.match('/api/**', '/api/v1/users'), true);
        assert.strictEqual(contextMatcher.match('/api/**', '/web/v1/users'), false);
    });

    it('supports function contexts', function () {
        const fn = function (pathname) {
            return pathname === '/exact';
        };
        assert.strictEqual(contextMatcher.match(fn, '/exact', {}), true);
        assert.strictEqual(contextMatcher.match(fn, '/other', {}), false);
    });

    it('throws for mixed invalid context arrays', function () {
        assert.throws(function () {
            contextMatcher.match(['/api/**', '/plain'], '/api/v1/users');
        }, /Invalid context/);
    });
});

describe('path-rewriter', function () {
    it('returns null when config is empty', function () {
        assert.strictEqual(pathRewriter.create({}), null);
        assert.strictEqual(pathRewriter.create(), null);
    });

    it('rewrites path using first matching rule', function () {
        const rewrite = pathRewriter.create({
            '^/api/v1': '/v1',
            '^/api': '/root'
        });

        assert.strictEqual(rewrite('/api/v1/users'), '/v1/users');
        assert.strictEqual(rewrite('/api/metrics'), '/root/metrics');
    });

    it('returns function config as-is', function () {
        const fn = function (path) {
            return path.toUpperCase();
        };
        assert.strictEqual(pathRewriter.create(fn), fn);
    });
});

describe('router.getTarget', function () {
    it('matches exact host in router table', function () {
        const req = {
            headers: {host: 'dev.localhost:3000'},
            url: '/dashboard'
        };
        const target = router.getTarget(req, {
            router: {
                'dev.localhost:3000': 'http://localhost:8000'
            }
        });
        assert.strictEqual(target, 'http://localhost:8000');
    });

    it('matches host and path key in router table', function () {
        const req = {
            headers: {host: 'dev.localhost:3000'},
            url: '/api/v2/dashboard'
        };
        const target = router.getTarget(req, {
            router: {
                'dev.localhost:3000/api/v2': 'http://localhost:9000'
            }
        });
        assert.strictEqual(target, 'http://localhost:9000');
    });
});
