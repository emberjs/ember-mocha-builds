define('ember-mocha', ['exports', 'ember', 'mocha', 'ember-test-helpers'], function (exports, _ember, _mocha, _emberTestHelpers) {
  'use strict';

  function createModule(Constructor, name, description, callbacks, tests, method) {
    _ember['default'].deprecate('The describeModule(), describeModel() and describeComponent() methods have been deprecated in favor of ' + 'setupTest(), setupModelTest() and setupComponentTest().', false, { id: 'ember-mocha.describe-helpers', until: '1.0.0', url: 'https://github.com/emberjs/ember-mocha#upgrading' });

    var module;

    if (!tests) {
      if (!callbacks) {
        tests = description;
        callbacks = {};
      } else {
        tests = callbacks;
        callbacks = description;
      }
      module = new Constructor(name, callbacks);
    } else {
      module = new Constructor(name, description, callbacks);
    }

    function moduleBody() {
      _mocha.beforeEach(function () {
        var _this = this;

        return module.setup().then(function () {
          var context = _emberTestHelpers.getContext();
          Object.keys(context).forEach(function (key) {
            _this[key] = context[key];
          });
        });
      });

      _mocha.afterEach(function () {
        return module.teardown();
      });

      _mocha.after(function () {
        module = null;
      });

      tests = tests || function () {};
      tests.call(this);
    }
    if (method) {
      _mocha.describe[method](module.name, moduleBody);
    } else {
      _mocha.describe(module.name, moduleBody);
    }
  }

  function createOnly(Constructor) {
    return function (name, description, callbacks, tests) {
      createModule(Constructor, name, description, callbacks, tests, "only");
    };
  }

  function createSkip(Constructor) {
    return function (name, description, callbacks, tests) {
      createModule(Constructor, name, description, callbacks, tests, "skip");
    };
  }

  function describeModule(name, description, callbacks, tests) {
    createModule(_emberTestHelpers.TestModule, name, description, callbacks, tests);
  }

  describeModule.only = createOnly(_emberTestHelpers.TestModule);

  describeModule.skip = createSkip(_emberTestHelpers.TestModule);

  function describeComponent(name, description, callbacks, tests) {
    createModule(_emberTestHelpers.TestModuleForComponent, name, description, callbacks, tests);
  }

  describeComponent.only = createOnly(_emberTestHelpers.TestModuleForComponent);

  describeComponent.skip = createSkip(_emberTestHelpers.TestModuleForComponent);

  function describeModel(name, description, callbacks, tests) {
    createModule(_emberTestHelpers.TestModuleForModel, name, description, callbacks, tests);
  }

  describeModel.only = createOnly(_emberTestHelpers.TestModuleForModel);

  describeModel.skip = createSkip(_emberTestHelpers.TestModuleForModel);

  var setupTestFactory = function setupTestFactory(Constructor) {
    return function setupTest(moduleName) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var module;

      if (_ember['default'].typeOf(moduleName) === 'object') {
        options = moduleName;
        moduleName = '';
      }

      _mocha.before(function () {
        module = new Constructor(moduleName, options);
      });

      _mocha.beforeEach(function () {
        var _this2 = this;

        return module.setup().then(function () {
          var context = _emberTestHelpers.getContext();
          Object.keys(context).forEach(function (key) {
            _this2[key] = context[key];
          });
        });
      });

      _mocha.afterEach(function () {
        return module.teardown();
      });

      _mocha.after(function () {
        module = null;
      });
    };
  };

  var setupTest = setupTestFactory(_emberTestHelpers.TestModule);
  var setupAcceptanceTest = setupTestFactory(_emberTestHelpers.TestModuleForAcceptance);
  var setupComponentTest = setupTestFactory(_emberTestHelpers.TestModuleForComponent);
  var setupModelTest = setupTestFactory(_emberTestHelpers.TestModuleForModel);

  exports.describeModule = describeModule;
  exports.describeComponent = describeComponent;
  exports.describeModel = describeModel;
  exports.setupTest = setupTest;
  exports.setupAcceptanceTest = setupAcceptanceTest;
  exports.setupComponentTest = setupComponentTest;
  exports.setupModelTest = setupModelTest;
  exports.it = _mocha.it;
  exports.setResolver = _emberTestHelpers.setResolver;
});
define('ember-test-helpers', ['exports', 'ember', 'require'], function (exports, _ember, _require) {
  'use strict';

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  /* globals self */

  var jQuery = _ember['default'].$;

  var requests;
  function incrementAjaxPendingRequests(_, xhr) {
    requests.push(xhr);
  }

  function decrementAjaxPendingRequests(_, xhr) {
    for (var i = 0; i < requests.length; i++) {
      if (xhr === requests[i]) {
        requests.splice(i, 1);
      }
    }
  }

  function _teardownAJAXHooks() {
    if (!jQuery) {
      return;
    }

    jQuery(document).off('ajaxSend', incrementAjaxPendingRequests);
    jQuery(document).off('ajaxComplete', decrementAjaxPendingRequests);
  }

  function _setupAJAXHooks() {
    requests = [];

    if (!jQuery) {
      return;
    }

    jQuery(document).on('ajaxSend', incrementAjaxPendingRequests);
    jQuery(document).on('ajaxComplete', decrementAjaxPendingRequests);
  }

  var _internalCheckWaiters;
  if (_ember['default'].__loader.registry['ember-testing/test/waiters']) {
    _internalCheckWaiters = _ember['default'].__loader.require('ember-testing/test/waiters').checkWaiters;
  }

  var __test_context__;

  function setContext(context) {
    __test_context__ = context;
  }

  function _getContext() {
    return __test_context__;
  }

  function unsetContext() {
    __test_context__ = undefined;
  }

  // calling this `merge` here because we cannot
  // actually assume it is like `Object.assign`
  // with > 2 args
  var merge = _ember['default'].assign || _ember['default'].merge;

  var AbstractTestModule = (function () {
    function AbstractTestModule(name, options) {
      _classCallCheck(this, AbstractTestModule);

      this.context = undefined;
      this.name = name;
      this.callbacks = options || {};

      this.initSetupSteps();
      this.initTeardownSteps();
    }

    AbstractTestModule.prototype.setup = function setup(assert) {
      var _this2 = this;

      return this.invokeSteps(this.setupSteps, this, assert).then(function () {
        _this2.contextualizeCallbacks();
        return _this2.invokeSteps(_this2.contextualizedSetupSteps, _this2.context, assert);
      });
    };

    AbstractTestModule.prototype.teardown = function teardown(assert) {
      var _this3 = this;

      return this.invokeSteps(this.contextualizedTeardownSteps, this.context, assert).then(function () {
        return _this3.invokeSteps(_this3.teardownSteps, _this3, assert);
      }).then(function () {
        _this3.cache = null;
        _this3.cachedCalls = null;
      });
    };

    AbstractTestModule.prototype.initSetupSteps = function initSetupSteps() {
      this.setupSteps = [];
      this.contextualizedSetupSteps = [];

      if (this.callbacks.beforeSetup) {
        this.setupSteps.push(this.callbacks.beforeSetup);
        delete this.callbacks.beforeSetup;
      }

      this.setupSteps.push(this.setupContext);
      this.setupSteps.push(this.setupTestElements);
      this.setupSteps.push(this.setupAJAXListeners);

      if (this.callbacks.setup) {
        this.contextualizedSetupSteps.push(this.callbacks.setup);
        delete this.callbacks.setup;
      }
    };

    AbstractTestModule.prototype.invokeSteps = function invokeSteps(steps, context, assert) {
      steps = steps.slice();

      function nextStep() {
        var step = steps.shift();
        if (step) {
          // guard against exceptions, for example missing components referenced from needs.
          return new _ember['default'].RSVP.Promise(function (resolve) {
            resolve(step.call(context, assert));
          }).then(nextStep);
        } else {
          return _ember['default'].RSVP.resolve();
        }
      }
      return nextStep();
    };

    AbstractTestModule.prototype.contextualizeCallbacks = function contextualizeCallbacks() {};

    AbstractTestModule.prototype.initTeardownSteps = function initTeardownSteps() {
      this.teardownSteps = [];
      this.contextualizedTeardownSteps = [];

      if (this.callbacks.teardown) {
        this.contextualizedTeardownSteps.push(this.callbacks.teardown);
        delete this.callbacks.teardown;
      }

      this.teardownSteps.push(this.teardownContext);
      this.teardownSteps.push(this.teardownTestElements);
      this.teardownSteps.push(this.teardownAJAXListeners);

      if (this.callbacks.afterTeardown) {
        this.teardownSteps.push(this.callbacks.afterTeardown);
        delete this.callbacks.afterTeardown;
      }
    };

    AbstractTestModule.prototype.setupTestElements = function setupTestElements() {
      var testEl = document.querySelector('#ember-testing');
      if (!testEl) {
        var element = document.createElement('div');
        element.setAttribute('id', 'ember-testing');

        document.body.appendChild(element);
        this.fixtureResetValue = '';
      } else {
        this.fixtureResetValue = testEl.innerHTML;
      }
    };

    AbstractTestModule.prototype.setupContext = function setupContext(options) {
      var context = this.getContext();

      merge(context, {
        dispatcher: null,
        inject: {}
      });
      merge(context, options);

      this.setToString();
      setContext(context);
      this.context = context;
    };

    AbstractTestModule.prototype.setContext = function setContext(context) {
      this.context = context;
    };

    AbstractTestModule.prototype.getContext = function getContext() {
      if (this.context) {
        return this.context;
      }

      return this.context = _getContext() || {};
    };

    AbstractTestModule.prototype.setToString = function setToString() {
      var _this4 = this;

      this.context.toString = function () {
        if (_this4.subjectName) {
          return 'test context for: ' + _this4.subjectName;
        }

        if (_this4.name) {
          return 'test context for: ' + _this4.name;
        }
      };
    };

    AbstractTestModule.prototype.setupAJAXListeners = function setupAJAXListeners() {
      _setupAJAXHooks();
    };

    AbstractTestModule.prototype.teardownAJAXListeners = function teardownAJAXListeners() {
      _teardownAJAXHooks();
    };

    AbstractTestModule.prototype.teardownTestElements = function teardownTestElements() {
      document.getElementById('ember-testing').innerHTML = this.fixtureResetValue;

      // Ember 2.0.0 removed Ember.View as public API, so only do this when
      // Ember.View is present
      if (_ember['default'].View && _ember['default'].View.views) {
        _ember['default'].View.views = {};
      }
    };

    AbstractTestModule.prototype.teardownContext = function teardownContext() {
      var context = this.context;
      this.context = undefined;
      unsetContext();

      if (context && context.dispatcher && !context.dispatcher.isDestroyed) {
        _ember['default'].run(function () {
          context.dispatcher.destroy();
        });
      }
    };

    return AbstractTestModule;
  })();

  var __resolver__;

  function setResolver(resolver) {
    __resolver__ = resolver;
  }

  function getResolver() {
    if (__resolver__ == null) {
      throw new Error('you must set a resolver with `testResolver.set(resolver)`');
    }

    return __resolver__;
  }

  /* globals global, self, requirejs */

  function exposeRegistryMethodsWithoutDeprecations(container) {
    var methods = ['register', 'unregister', 'resolve', 'normalize', 'typeInjection', 'injection', 'factoryInjection', 'factoryTypeInjection', 'has', 'options', 'optionsForType'];

    function exposeRegistryMethod(container, method) {
      if (method in container) {
        container[method] = function () {
          return container._registry[method].apply(container._registry, arguments);
        };
      }
    }

    for (var i = 0, l = methods.length; i < l; i++) {
      exposeRegistryMethod(container, methods[i]);
    }
  }

  var Owner = (function () {
    if (_ember['default']._RegistryProxyMixin && _ember['default']._ContainerProxyMixin) {
      return _ember['default'].Object.extend(_ember['default']._RegistryProxyMixin, _ember['default']._ContainerProxyMixin);
    }

    return _ember['default'].Object.extend();
  })();

  var buildRegistry = function buildRegistry(resolver) {
    var fallbackRegistry, registry, container;
    var namespace = _ember['default'].Object.create({
      Resolver: { create: function create() {
          return resolver;
        } }
    });

    function register(name, factory) {
      var thingToRegisterWith = registry || container;

      if (!(container.factoryFor ? container.factoryFor(name) : container.lookupFactory(name))) {
        thingToRegisterWith.register(name, factory);
      }
    }

    if (_ember['default'].Application.buildRegistry) {
      fallbackRegistry = _ember['default'].Application.buildRegistry(namespace);
      fallbackRegistry.register('component-lookup:main', _ember['default'].ComponentLookup);

      registry = new _ember['default'].Registry({
        fallback: fallbackRegistry
      });

      if (_ember['default'].ApplicationInstance && _ember['default'].ApplicationInstance.setupRegistry) {
        _ember['default'].ApplicationInstance.setupRegistry(registry);
      }

      // these properties are set on the fallback registry by `buildRegistry`
      // and on the primary registry within the ApplicationInstance constructor
      // but we need to manually recreate them since ApplicationInstance's are not
      // exposed externally
      registry.normalizeFullName = fallbackRegistry.normalizeFullName;
      registry.makeToString = fallbackRegistry.makeToString;
      registry.describe = fallbackRegistry.describe;

      var owner = Owner.create({
        __registry__: registry,
        __container__: null
      });

      container = registry.container({ owner: owner });
      owner.__container__ = container;

      exposeRegistryMethodsWithoutDeprecations(container);
    } else {
      container = _ember['default'].Application.buildContainer(namespace);
      container.register('component-lookup:main', _ember['default'].ComponentLookup);
    }

    // Ember 1.10.0 did not properly add `view:toplevel` or `view:default`
    // to the registry in Ember.Application.buildRegistry :(
    //
    // Ember 2.0.0 removed Ember.View as public API, so only do this when
    // Ember.View is present
    if (_ember['default'].View) {
      register('view:toplevel', _ember['default'].View.extend());
    }

    // Ember 2.0.0 removed Ember._MetamorphView from the Ember global, so only
    // do this when present
    if (_ember['default']._MetamorphView) {
      register('view:default', _ember['default']._MetamorphView);
    }

    var globalContext = typeof global === 'object' && global || self;
    if (requirejs.entries['ember-data/setup-container']) {
      // ember-data is a proper ember-cli addon since 2.3; if no 'import
      // 'ember-data'' is present somewhere in the tests, there is also no `DS`
      // available on the globalContext and hence ember-data wouldn't be setup
      // correctly for the tests; that's why we import and call setupContainer
      // here; also see https://github.com/emberjs/data/issues/4071 for context
      var setupContainer = _require['default']('ember-data/setup-container')['default'];
      setupContainer(registry || container);
    } else if (globalContext.DS) {
      var DS = globalContext.DS;
      if (DS._setupContainer) {
        DS._setupContainer(registry || container);
      } else {
        register('transform:boolean', DS.BooleanTransform);
        register('transform:date', DS.DateTransform);
        register('transform:number', DS.NumberTransform);
        register('transform:string', DS.StringTransform);
        register('serializer:-default', DS.JSONSerializer);
        register('serializer:-rest', DS.RESTSerializer);
        register('adapter:-rest', DS.RESTAdapter);
      }
    }

    return {
      registry: registry,
      container: container
    };
  };

  function hasEmberVersion(major, minor) {
    var numbers = _ember['default'].VERSION.split('-')[0].split('.');
    var actualMajor = parseInt(numbers[0], 10);
    var actualMinor = parseInt(numbers[1], 10);
    return actualMajor > major || actualMajor === major && actualMinor >= minor;
  }

  var TestModule = (function (_AbstractTestModule) {
    _inherits(TestModule, _AbstractTestModule);

    function TestModule(subjectName, description, callbacks) {
      _classCallCheck(this, TestModule);

      // Allow `description` to be omitted, in which case it should
      // default to `subjectName`
      if (!callbacks && typeof description === 'object') {
        callbacks = description;
        description = subjectName;
      }

      _AbstractTestModule.call(this, description || subjectName, callbacks);

      this.subjectName = subjectName;
      this.description = description || subjectName;
      this.resolver = this.callbacks.resolver || getResolver();

      if (this.callbacks.integration && this.callbacks.needs) {
        throw new Error("cannot declare 'integration: true' and 'needs' in the same module");
      }

      if (this.callbacks.integration) {
        this.initIntegration(callbacks);
        delete callbacks.integration;
      }

      this.initSubject();
      this.initNeeds();
    }

    TestModule.prototype.initIntegration = function initIntegration(options) {
      if (options.integration === 'legacy') {
        throw new Error('`integration: \'legacy\'` is only valid for component tests.');
      }
      this.isIntegration = true;
    };

    TestModule.prototype.initSubject = function initSubject() {
      this.callbacks.subject = this.callbacks.subject || this.defaultSubject;
    };

    TestModule.prototype.initNeeds = function initNeeds() {
      this.needs = [this.subjectName];
      if (this.callbacks.needs) {
        this.needs = this.needs.concat(this.callbacks.needs);
        delete this.callbacks.needs;
      }
    };

    TestModule.prototype.initSetupSteps = function initSetupSteps() {
      this.setupSteps = [];
      this.contextualizedSetupSteps = [];

      if (this.callbacks.beforeSetup) {
        this.setupSteps.push(this.callbacks.beforeSetup);
        delete this.callbacks.beforeSetup;
      }

      this.setupSteps.push(this.setupContainer);
      this.setupSteps.push(this.setupContext);
      this.setupSteps.push(this.setupTestElements);
      this.setupSteps.push(this.setupAJAXListeners);

      if (this.callbacks.setup) {
        this.contextualizedSetupSteps.push(this.callbacks.setup);
        delete this.callbacks.setup;
      }
    };

    TestModule.prototype.initTeardownSteps = function initTeardownSteps() {
      this.teardownSteps = [];
      this.contextualizedTeardownSteps = [];

      if (this.callbacks.teardown) {
        this.contextualizedTeardownSteps.push(this.callbacks.teardown);
        delete this.callbacks.teardown;
      }

      this.teardownSteps.push(this.teardownSubject);
      this.teardownSteps.push(this.teardownContainer);
      this.teardownSteps.push(this.teardownContext);
      this.teardownSteps.push(this.teardownTestElements);
      this.teardownSteps.push(this.teardownAJAXListeners);

      if (this.callbacks.afterTeardown) {
        this.teardownSteps.push(this.callbacks.afterTeardown);
        delete this.callbacks.afterTeardown;
      }
    };

    TestModule.prototype.setupContainer = function setupContainer() {
      if (this.isIntegration || this.isLegacy) {
        this._setupIntegratedContainer();
      } else {
        this._setupIsolatedContainer();
      }
    };

    TestModule.prototype.setupContext = function setupContext() {
      var subjectName = this.subjectName;
      var container = this.container;

      var factory = function factory() {
        return container.factoryFor ? container.factoryFor(subjectName) : container.lookupFactory(subjectName);
      };

      _AbstractTestModule.prototype.setupContext.call(this, {
        container: this.container,
        registry: this.registry,
        factory: factory,
        register: function register() {
          var target = this.registry || this.container;
          return target.register.apply(target, arguments);
        }
      });

      if (_ember['default'].setOwner) {
        _ember['default'].setOwner(this.context, this.container.owner);
      }

      this.setupInject();
    };

    TestModule.prototype.setupInject = function setupInject() {
      var module = this;
      var context = this.context;

      if (_ember['default'].inject) {
        var keys = (Object.keys || _ember['default'].keys)(_ember['default'].inject);

        keys.forEach(function (typeName) {
          context.inject[typeName] = function (name, opts) {
            var alias = opts && opts.as || name;
            _ember['default'].run(function () {
              _ember['default'].set(context, alias, module.container.lookup(typeName + ':' + name));
            });
          };
        });
      }
    };

    TestModule.prototype.teardownSubject = function teardownSubject() {
      var subject = this.cache.subject;

      if (subject) {
        _ember['default'].run(function () {
          _ember['default'].tryInvoke(subject, 'destroy');
        });
      }
    };

    TestModule.prototype.teardownContainer = function teardownContainer() {
      var container = this.container;
      _ember['default'].run(function () {
        container.destroy();
      });
    };

    TestModule.prototype.defaultSubject = function defaultSubject(options, factory) {
      return factory.create(options);
    };

    // allow arbitrary named factories, like rspec let

    TestModule.prototype.contextualizeCallbacks = function contextualizeCallbacks() {
      var callbacks = this.callbacks;
      var context = this.context;

      this.cache = this.cache || {};
      this.cachedCalls = this.cachedCalls || {};

      var keys = (Object.keys || _ember['default'].keys)(callbacks);
      var keysLength = keys.length;

      if (keysLength) {
        var deprecatedContext = this._buildDeprecatedContext(this, context);
        for (var i = 0; i < keysLength; i++) {
          this._contextualizeCallback(context, keys[i], deprecatedContext);
        }
      }
    };

    TestModule.prototype._contextualizeCallback = function _contextualizeCallback(context, key, callbackContext) {
      var _this = this;
      var callbacks = this.callbacks;
      var factory = context.factory;

      context[key] = function (options) {
        if (_this.cachedCalls[key]) {
          return _this.cache[key];
        }

        var result = callbacks[key].call(callbackContext, options, factory());

        _this.cache[key] = result;
        _this.cachedCalls[key] = true;

        return result;
      };
    };

    /*
      Builds a version of the passed in context that contains deprecation warnings
      for accessing properties that exist on the module.
    */

    TestModule.prototype._buildDeprecatedContext = function _buildDeprecatedContext(module, context) {
      var deprecatedContext = Object.create(context);

      var keysForDeprecation = Object.keys(module);

      for (var i = 0, l = keysForDeprecation.length; i < l; i++) {
        this._proxyDeprecation(module, deprecatedContext, keysForDeprecation[i]);
      }

      return deprecatedContext;
    };

    /*
      Defines a key on an object to act as a proxy for deprecating the original.
    */

    TestModule.prototype._proxyDeprecation = function _proxyDeprecation(obj, proxy, key) {
      if (typeof proxy[key] === 'undefined') {
        Object.defineProperty(proxy, key, {
          get: function get() {
            _ember['default'].deprecate('Accessing the test module property "' + key + '" from a callback is deprecated.', false, { id: 'ember-test-helpers.test-module.callback-context', until: '0.6.0' });
            return obj[key];
          }
        });
      }
    };

    TestModule.prototype._setupContainer = function _setupContainer(isolated) {
      var resolver = this.resolver;

      var items = buildRegistry(!isolated ? resolver : Object.create(resolver, {
        resolve: {
          value: function value() {}
        }
      }));

      this.container = items.container;
      this.registry = items.registry;

      if (hasEmberVersion(1, 13)) {
        var thingToRegisterWith = this.registry || this.container;
        var router = resolver.resolve('router:main');
        router = router || _ember['default'].Router.extend();
        thingToRegisterWith.register('router:main', router);
      }
    };

    TestModule.prototype._setupIsolatedContainer = function _setupIsolatedContainer() {
      var resolver = this.resolver;
      this._setupContainer(true);

      var thingToRegisterWith = this.registry || this.container;

      for (var i = this.needs.length; i > 0; i--) {
        var fullName = this.needs[i - 1];
        var normalizedFullName = resolver.normalize(fullName);
        thingToRegisterWith.register(fullName, resolver.resolve(normalizedFullName));
      }

      if (!this.registry) {
        this.container.resolver = function () {};
      }
    };

    TestModule.prototype._setupIntegratedContainer = function _setupIntegratedContainer() {
      this._setupContainer();
    };

    return TestModule;
  })(AbstractTestModule);

  var testModuleForAcceptance = (function (_AbstractTestModule2) {
    _inherits(testModuleForAcceptance, _AbstractTestModule2);

    function testModuleForAcceptance() {
      _classCallCheck(this, testModuleForAcceptance);

      _AbstractTestModule2.apply(this, arguments);
    }

    testModuleForAcceptance.prototype.setupContext = function setupContext() {
      _AbstractTestModule2.prototype.setupContext.call(this, { application: this.createApplication() });
    };

    testModuleForAcceptance.prototype.teardownContext = function teardownContext() {
      _ember['default'].run(function () {
        _getContext().application.destroy();
      });

      _AbstractTestModule2.prototype.teardownContext.call(this);
    };

    testModuleForAcceptance.prototype.createApplication = function createApplication() {
      var _callbacks = this.callbacks;
      var Application = _callbacks.Application;
      var config = _callbacks.config;

      var application = undefined;

      _ember['default'].run(function () {
        application = Application.create(config);
        application.setupForTesting();
        application.injectTestHelpers();
      });

      return application;
    };

    return testModuleForAcceptance;
  })(AbstractTestModule);

  function preGlimmerSetupIntegrationForComponent() {
    var module = this;
    var context = this.context;

    this.actionHooks = {};

    context.dispatcher = this.container.lookup('event_dispatcher:main') || _ember['default'].EventDispatcher.create();
    context.dispatcher.setup({}, '#ember-testing');
    context.actions = module.actionHooks;

    (this.registry || this.container).register('component:-test-holder', _ember['default'].Component.extend());

    context.render = function (template) {
      // in case `this.render` is called twice, make sure to teardown the first invocation
      module.teardownComponent();

      if (!template) {
        throw new Error("in a component integration test you must pass a template to `render()`");
      }
      if (_ember['default'].isArray(template)) {
        template = template.join('');
      }
      if (typeof template === 'string') {
        template = _ember['default'].Handlebars.compile(template);
      }
      module.component = module.container.lookupFactory('component:-test-holder').create({
        layout: template
      });

      module.component.set('context', context);
      module.component.set('controller', context);

      _ember['default'].run(function () {
        module.component.appendTo('#ember-testing');
      });

      context._element = module.component.element;
    };

    context.$ = function () {
      return module.component.$.apply(module.component, arguments);
    };

    context.set = function (key, value) {
      var ret = _ember['default'].run(function () {
        return _ember['default'].set(context, key, value);
      });

      if (hasEmberVersion(2, 0)) {
        return ret;
      }
    };

    context.setProperties = function (hash) {
      var ret = _ember['default'].run(function () {
        return _ember['default'].setProperties(context, hash);
      });

      if (hasEmberVersion(2, 0)) {
        return ret;
      }
    };

    context.get = function (key) {
      return _ember['default'].get(context, key);
    };

    context.getProperties = function () {
      var args = Array.prototype.slice.call(arguments);
      return _ember['default'].getProperties(context, args);
    };

    context.on = function (actionName, handler) {
      module.actionHooks[actionName] = handler;
    };

    context.send = function (actionName) {
      var hook = module.actionHooks[actionName];
      if (!hook) {
        throw new Error("integration testing template received unexpected action " + actionName);
      }
      hook.apply(module, Array.prototype.slice.call(arguments, 1));
    };

    context.clearRender = function () {
      module.teardownComponent();
    };
  }

  var ACTION_KEY = undefined;
  if (hasEmberVersion(2, 0)) {
    ACTION_KEY = 'actions';
  } else {
    ACTION_KEY = '_actions';
  }

  var isPreGlimmer$1 = !hasEmberVersion(1, 13);

  var getOwner = _ember['default'].getOwner;

  var testModuleForComponent = (function (_TestModule) {
    _inherits(testModuleForComponent, _TestModule);

    function testModuleForComponent(componentName, description, callbacks) {
      _classCallCheck(this, testModuleForComponent);

      // Allow `description` to be omitted
      if (!callbacks && typeof description === 'object') {
        callbacks = description;
        description = null;
      } else if (!callbacks) {
        callbacks = {};
      }

      var integrationOption = callbacks.integration;
      var hasNeeds = Array.isArray(callbacks.needs);

      _TestModule.call(this, 'component:' + componentName, description, callbacks);

      this.componentName = componentName;

      if (hasNeeds || callbacks.unit || integrationOption === false) {
        this.isUnitTest = true;
      } else if (integrationOption) {
        this.isUnitTest = false;
      } else {
        _ember['default'].deprecate("the component:" + componentName + " test module is implicitly running in unit test mode, " + "which will change to integration test mode by default in an upcoming version of " + "ember-test-helpers. Add `unit: true` or a `needs:[]` list to explicitly opt in to unit " + "test mode.", false, { id: 'ember-test-helpers.test-module-for-component.test-type', until: '0.6.0' });
        this.isUnitTest = true;
      }

      if (!this.isUnitTest && !this.isLegacy) {
        callbacks.integration = true;
      }

      if (this.isUnitTest || this.isLegacy) {
        this.setupSteps.push(this.setupComponentUnitTest);
      } else {
        this.callbacks.subject = function () {
          throw new Error("component integration tests do not support `subject()`. Instead, render the component as if it were HTML: `this.render('<my-component foo=true>');`. For more information, read: http://guides.emberjs.com/v2.2.0/testing/testing-components/");
        };
        this.setupSteps.push(this.setupComponentIntegrationTest);
        this.teardownSteps.unshift(this.teardownComponent);
      }

      if (_ember['default'].View && _ember['default'].View.views) {
        this.setupSteps.push(this._aliasViewRegistry);
        this.teardownSteps.unshift(this._resetViewRegistry);
      }
    }

    testModuleForComponent.prototype.initIntegration = function initIntegration(options) {
      this.isLegacy = options.integration === 'legacy';
      this.isIntegration = options.integration !== 'legacy';
    };

    testModuleForComponent.prototype._aliasViewRegistry = function _aliasViewRegistry() {
      this._originalGlobalViewRegistry = _ember['default'].View.views;
      var viewRegistry = this.container.lookup('-view-registry:main');

      if (viewRegistry) {
        _ember['default'].View.views = viewRegistry;
      }
    };

    testModuleForComponent.prototype._resetViewRegistry = function _resetViewRegistry() {
      _ember['default'].View.views = this._originalGlobalViewRegistry;
    };

    testModuleForComponent.prototype.setupComponentUnitTest = function setupComponentUnitTest() {
      var _this = this;
      var resolver = this.resolver;
      var context = this.context;

      var layoutName = 'template:components/' + this.componentName;

      var layout = resolver.resolve(layoutName);

      var thingToRegisterWith = this.registry || this.container;
      if (layout) {
        thingToRegisterWith.register(layoutName, layout);
        thingToRegisterWith.injection(this.subjectName, 'layout', layoutName);
      }

      context.dispatcher = this.container.lookup('event_dispatcher:main') || _ember['default'].EventDispatcher.create();
      context.dispatcher.setup({}, '#ember-testing');

      context._element = null;

      this.callbacks.render = function () {
        var subject;

        _ember['default'].run(function () {
          subject = context.subject();
          subject.appendTo('#ember-testing');
        });

        context._element = subject.element;

        _this.teardownSteps.unshift(function () {
          _ember['default'].run(function () {
            _ember['default'].tryInvoke(subject, 'destroy');
          });
        });
      };

      this.callbacks.append = function () {
        _ember['default'].deprecate('this.append() is deprecated. Please use this.render() or this.$() instead.', false, { id: 'ember-test-helpers.test-module-for-component.append', until: '0.6.0' });
        return context.$();
      };

      context.$ = function () {
        this.render();
        var subject = this.subject();

        return subject.$.apply(subject, arguments);
      };
    };

    testModuleForComponent.prototype.setupComponentIntegrationTest = function setupComponentIntegrationTest() {
      if (isPreGlimmer$1) {
        return preGlimmerSetupIntegrationForComponent.apply(this, arguments);
      } else {
        return _setupComponentIntegrationTest.apply(this, arguments);
      }
    };

    testModuleForComponent.prototype.setupContext = function setupContext() {
      _TestModule.prototype.setupContext.call(this);

      // only setup the injection if we are running against a version
      // of Ember that has `-view-registry:main` (Ember >= 1.12)
      if (this.container.factoryFor ? this.container.factoryFor('-view-registry:main') : this.container.lookupFactory('-view-registry:main')) {
        (this.registry || this.container).injection('component', '_viewRegistry', '-view-registry:main');
      }

      if (!this.isUnitTest && !this.isLegacy) {
        this.context.factory = function () {};
      }
    };

    testModuleForComponent.prototype.teardownComponent = function teardownComponent() {
      var component = this.component;
      if (component) {
        _ember['default'].run(component, 'destroy');
        this.component = null;
      }
    };

    return testModuleForComponent;
  })(TestModule);

  function _setupComponentIntegrationTest() {
    var module = this;
    var context = this.context;

    this.actionHooks = context[ACTION_KEY] = {};
    context.dispatcher = this.container.lookup('event_dispatcher:main') || _ember['default'].EventDispatcher.create();
    context.dispatcher.setup({}, '#ember-testing');

    var hasRendered = false;
    var OutletView = module.container.factoryFor ? module.container.factoryFor('view:-outlet') : module.container.lookupFactory('view:-outlet');
    var OutletTemplate = module.container.lookup('template:-outlet');
    var toplevelView = module.component = OutletView.create();
    var hasOutletTemplate = !!OutletTemplate;
    var outletState = {
      render: {
        owner: getOwner ? getOwner(module.container) : undefined,
        into: undefined,
        outlet: 'main',
        name: 'application',
        controller: module.context,
        ViewClass: undefined,
        template: OutletTemplate
      },

      outlets: {}
    };

    var element = document.getElementById('ember-testing');
    var templateId = 0;

    if (hasOutletTemplate) {
      _ember['default'].run(function () {
        toplevelView.setOutletState(outletState);
      });
    }

    context.render = function (template) {
      if (!template) {
        throw new Error("in a component integration test you must pass a template to `render()`");
      }
      if (_ember['default'].isArray(template)) {
        template = template.join('');
      }
      if (typeof template === 'string') {
        template = _ember['default'].Handlebars.compile(template);
      }

      var templateFullName = 'template:-undertest-' + ++templateId;
      this.registry.register(templateFullName, template);
      var stateToRender = {
        owner: getOwner ? getOwner(module.container) : undefined,
        into: undefined,
        outlet: 'main',
        name: 'index',
        controller: module.context,
        ViewClass: undefined,
        template: module.container.lookup(templateFullName),
        outlets: {}
      };

      if (hasOutletTemplate) {
        stateToRender.name = 'index';
        outletState.outlets.main = { render: stateToRender, outlets: {} };
      } else {
        stateToRender.name = 'application';
        outletState = { render: stateToRender, outlets: {} };
      }

      _ember['default'].run(function () {
        toplevelView.setOutletState(outletState);
      });

      if (!hasRendered) {
        _ember['default'].run(module.component, 'appendTo', '#ember-testing');
        hasRendered = true;
      }

      // ensure the element is based on the wrapping toplevel view
      // Ember still wraps the main application template with a
      // normal tagged view
      context._element = element = document.querySelector('#ember-testing > .ember-view');
    };

    context.$ = function (selector) {
      // emulates Ember internal behavor of `this.$` in a component
      // https://github.com/emberjs/ember.js/blob/v2.5.1/packages/ember-views/lib/views/states/has_element.js#L18
      return selector ? _ember['default'].$(selector, element) : _ember['default'].$(element);
    };

    context.set = function (key, value) {
      var ret = _ember['default'].run(function () {
        return _ember['default'].set(context, key, value);
      });

      if (hasEmberVersion(2, 0)) {
        return ret;
      }
    };

    context.setProperties = function (hash) {
      var ret = _ember['default'].run(function () {
        return _ember['default'].setProperties(context, hash);
      });

      if (hasEmberVersion(2, 0)) {
        return ret;
      }
    };

    context.get = function (key) {
      return _ember['default'].get(context, key);
    };

    context.getProperties = function () {
      var args = Array.prototype.slice.call(arguments);
      return _ember['default'].getProperties(context, args);
    };

    context.on = function (actionName, handler) {
      module.actionHooks[actionName] = handler;
    };

    context.send = function (actionName) {
      var hook = module.actionHooks[actionName];
      if (!hook) {
        throw new Error("integration testing template received unexpected action " + actionName);
      }
      hook.apply(module.context, Array.prototype.slice.call(arguments, 1));
    };

    context.clearRender = function () {
      _ember['default'].run(function () {
        toplevelView.setOutletState({
          render: {
            owner: module.container,
            into: undefined,
            outlet: 'main',
            name: 'application',
            controller: module.context,
            ViewClass: undefined,
            template: undefined
          },
          outlets: {}
        });
      });
    };
  }

  var isPreGlimmer = !hasEmberVersion(1, 13);

  var testModuleForIntegration = (function (_AbstractTestModule3) {
    _inherits(testModuleForIntegration, _AbstractTestModule3);

    function testModuleForIntegration() {
      _classCallCheck(this, testModuleForIntegration);

      _AbstractTestModule3.apply(this, arguments);
      this.resolver = this.callbacks.resolver || getResolver();
    }

    testModuleForIntegration.prototype.initSetupSteps = function initSetupSteps() {
      this.setupSteps = [];
      this.contextualizedSetupSteps = [];

      if (this.callbacks.beforeSetup) {
        this.setupSteps.push(this.callbacks.beforeSetup);
        delete this.callbacks.beforeSetup;
      }

      this.setupSteps.push(this.setupContainer);
      this.setupSteps.push(this.setupContext);
      this.setupSteps.push(this.setupTestElements);
      this.setupSteps.push(this.setupAJAXListeners);
      this.setupSteps.push(this.setupComponentIntegrationTest);

      if (_ember['default'].View && _ember['default'].View.views) {
        this.setupSteps.push(this._aliasViewRegistry);
      }

      if (this.callbacks.setup) {
        this.contextualizedSetupSteps.push(this.callbacks.setup);
        delete this.callbacks.setup;
      }
    };

    testModuleForIntegration.prototype.initTeardownSteps = function initTeardownSteps() {
      this.teardownSteps = [];
      this.contextualizedTeardownSteps = [];

      if (this.callbacks.teardown) {
        this.contextualizedTeardownSteps.push(this.callbacks.teardown);
        delete this.callbacks.teardown;
      }

      this.teardownSteps.push(this.teardownContainer);
      this.teardownSteps.push(this.teardownContext);
      this.teardownSteps.push(this.teardownAJAXListeners);
      this.teardownSteps.push(this.teardownComponent);

      if (_ember['default'].View && _ember['default'].View.views) {
        this.teardownSteps.push(this._resetViewRegistry);
      }

      this.teardownSteps.push(this.teardownTestElements);

      if (this.callbacks.afterTeardown) {
        this.teardownSteps.push(this.callbacks.afterTeardown);
        delete this.callbacks.afterTeardown;
      }
    };

    testModuleForIntegration.prototype.setupContainer = function setupContainer() {
      var resolver = this.resolver;
      var items = buildRegistry(resolver);

      this.container = items.container;
      this.registry = items.registry;

      if (hasEmberVersion(1, 13)) {
        var thingToRegisterWith = this.registry || this.container;
        var router = resolver.resolve('router:main');
        router = router || _ember['default'].Router.extend();
        thingToRegisterWith.register('router:main', router);
      }
    };

    testModuleForIntegration.prototype.setupContext = function setupContext() {
      var subjectName = this.subjectName;
      var container = this.container;

      var factory = function factory() {
        return container.factoryFor ? container.factoryFor(subjectName) : container.lookupFactory(subjectName);
      };

      _AbstractTestModule3.prototype.setupContext.call(this, {
        container: this.container,
        registry: this.registry,
        factory: factory,
        register: function register() {
          var target = this.registry || this.container;
          return target.register.apply(target, arguments);
        }
      });

      var context = this.context;

      if (_ember['default'].setOwner) {
        _ember['default'].setOwner(context, this.container.owner);
      }

      if (_ember['default'].inject) {
        var keys = (Object.keys || _ember['default'].keys)(_ember['default'].inject);
        keys.forEach(function (typeName) {
          context.inject[typeName] = function (name, opts) {
            var alias = opts && opts.as || name;
            _ember['default'].run(function () {
              _ember['default'].set(context, alias, context.container.lookup(typeName + ':' + name));
            });
          };
        });
      }

      // only setup the injection if we are running against a version
      // of Ember that has `-view-registry:main` (Ember >= 1.12)
      if (this.container.factoryFor ? this.container.factoryFor('-view-registry:main') : this.container.lookupFactory('-view-registry:main')) {
        (this.registry || this.container).injection('component', '_viewRegistry', '-view-registry:main');
      }
    };

    testModuleForIntegration.prototype.setupComponentIntegrationTest = function setupComponentIntegrationTest() {
      if (isPreGlimmer) {
        return preGlimmerSetupIntegrationForComponent.apply(this, arguments);
      } else {
        return _setupComponentIntegrationTest.apply(this, arguments);
      }
    };

    testModuleForIntegration.prototype.teardownComponent = function teardownComponent() {
      var component = this.component;
      if (component) {
        _ember['default'].run(function () {
          component.destroy();
        });
      }
    };

    testModuleForIntegration.prototype.teardownContainer = function teardownContainer() {
      var container = this.container;
      _ember['default'].run(function () {
        container.destroy();
      });
    };

    // allow arbitrary named factories, like rspec let

    testModuleForIntegration.prototype.contextualizeCallbacks = function contextualizeCallbacks() {
      var callbacks = this.callbacks;
      var context = this.context;

      this.cache = this.cache || {};
      this.cachedCalls = this.cachedCalls || {};

      var keys = (Object.keys || _ember['default'].keys)(callbacks);
      var keysLength = keys.length;

      if (keysLength) {
        for (var i = 0; i < keysLength; i++) {
          this._contextualizeCallback(context, keys[i], context);
        }
      }
    };

    testModuleForIntegration.prototype._contextualizeCallback = function _contextualizeCallback(context, key, callbackContext) {
      var _this = this;
      var callbacks = this.callbacks;
      var factory = context.factory;

      context[key] = function (options) {
        if (_this.cachedCalls[key]) {
          return _this.cache[key];
        }

        var result = callbacks[key].call(callbackContext, options, factory());

        _this.cache[key] = result;
        _this.cachedCalls[key] = true;

        return result;
      };
    };

    testModuleForIntegration.prototype._aliasViewRegistry = function _aliasViewRegistry() {
      this._originalGlobalViewRegistry = _ember['default'].View.views;
      var viewRegistry = this.container.lookup('-view-registry:main');

      if (viewRegistry) {
        _ember['default'].View.views = viewRegistry;
      }
    };

    testModuleForIntegration.prototype._resetViewRegistry = function _resetViewRegistry() {
      _ember['default'].View.views = this._originalGlobalViewRegistry;
    };

    return testModuleForIntegration;
  })(AbstractTestModule);

  /* global DS, requirejs */ // added here to prevent an import from erroring when ED is not present

  var testModuleForModel = (function (_TestModule2) {
    _inherits(testModuleForModel, _TestModule2);

    function testModuleForModel(modelName, description, callbacks) {
      _classCallCheck(this, testModuleForModel);

      _TestModule2.call(this, 'model:' + modelName, description, callbacks);

      this.modelName = modelName;

      this.setupSteps.push(this.setupModel);
    }

    testModuleForModel.prototype.setupModel = function setupModel() {
      var container = this.container;
      var defaultSubject = this.defaultSubject;
      var callbacks = this.callbacks;
      var modelName = this.modelName;

      var adapterFactory = container.factoryFor ? container.factoryFor('adapter:application') : container.lookupFactory('adapter:application');
      if (!adapterFactory) {
        if (requirejs.entries['ember-data/adapters/json-api']) {
          adapterFactory = _require['default']('ember-data/adapters/json-api')['default'];
        }

        // when ember-data/adapters/json-api is provided via ember-cli shims
        // using Ember Data 1.x the actual JSONAPIAdapter isn't found, but the
        // above require statement returns a bizzaro object with only a `default`
        // property (circular reference actually)
        if (!adapterFactory || !adapterFactory.create) {
          adapterFactory = DS.JSONAPIAdapter || DS.FixtureAdapter;
        }

        var thingToRegisterWith = this.registry || this.container;
        thingToRegisterWith.register('adapter:application', adapterFactory);
      }

      callbacks.store = function () {
        var container = this.container;
        return container.lookup('service:store') || container.lookup('store:main');
      };

      if (callbacks.subject === defaultSubject) {
        callbacks.subject = function (options) {
          var container = this.container;

          return _ember['default'].run(function () {
            var store = container.lookup('service:store') || container.lookup('store:main');
            return store.createRecord(modelName, options);
          });
        };
      }
    };

    return testModuleForModel;
  })(TestModule);

  _ember['default'].testing = true;

  exports.TestModule = TestModule;
  exports.TestModuleForAcceptance = testModuleForAcceptance;
  exports.TestModuleForIntegration = testModuleForIntegration;
  exports.TestModuleForComponent = testModuleForComponent;
  exports.TestModuleForModel = testModuleForModel;
  exports.getContext = _getContext;
  exports.setContext = setContext;
  exports.unsetContext = unsetContext;
  exports.setResolver = setResolver;
});
define('mocha', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  /*global mocha, describe, context, it, before, after */

  /**
   * Takes a function that defines a mocha hook, like `beforeEach` and
   * runs its callback inside an `Ember.run`.
   *
   * In the canonical mocha style, beforeEach/afterEach blocks are for
   * taking actions that have potentially asynchronous side effects like
   * making network requests, and in the case of ember doing things like
   * sending events, or visiting pages. In the context of an Ember
   * application this more often than not means doing something inside
   * of an `Ember.run`. The resulting wrapper has a reference to
   * original hook function as the `withoutEmberRun`. E.g.
   *
   *   import { beforeEach } from 'mocha';
   *
   *   beforeEach(function {
   *     // this is run inside `Ember.run`
   *   })
  
   *   beforeEach.withoutEmberRun(function({
   *    // this is not inside `Ember.run`
   *   }))
   *
   * You should almost never need to use the version without `Ember.run`
   *
   * Mocha supports two invocation styles for its hooks depending on the
   * synchronization requirements of the setup code, and this wrapper
   * supports both of them.
   *
   * As normal, if the setup code returns a promise, the testcase will
   * wait until the promise is settled.
  
   * @param {Function} original The native mocha hook to wrap
   * @returns {Function} the wrapped hook
   * @private
   */
  function wrapMochaHookInEmberRun(original) {
    function wrapper(fn) {
      // the callback expects a `done` parameter
      if (fn.length) {
        return original(function (done) {
          return _ember['default'].run((function (_this) {
            return function () {
              return fn.call(_this, done);
            };
          })(this));
        });
      } else {
        // no done parameter.
        return original(function () {
          return _ember['default'].run((function (_this) {
            return function () {
              return fn.call(_this);
            };
          })(this));
        });
      }
    }
    wrapper.withoutEmberRun = original;
    return wrapper;
  }

  var beforeEach = wrapMochaHookInEmberRun(window.beforeEach);
  var afterEach = wrapMochaHookInEmberRun(window.afterEach);

  exports.mocha = mocha;
  exports.describe = describe;
  exports.context = context;
  exports.it = it;
  exports.before = before;
  exports.beforeEach = beforeEach;
  exports.after = after;
  exports.afterEach = afterEach;
});//# sourceMappingURL=ember-mocha.amd.map
