define('chai', ['exports'], function (exports) {

	'use strict';

	/* globals chai */

	var expect = chai.expect;
	var assert = chai.assert;

	var use = chai.use;
	var Assertion = chai.Assertion;

	exports.expect = expect;
	exports.assert = assert;
	exports.use = use;
	exports.Assertion = Assertion;

});
define('ember-mocha', ['exports', 'ember-mocha/describe-module', 'ember-mocha/describe-component', 'ember-mocha/describe-model', 'ember-mocha/it', 'ember-test-helpers'], function (exports, describeModule, describeComponent, describeModel, it, ember_test_helpers) {

  'use strict';

  Object.defineProperty(exports, 'describeModule', { enumerable: true, get: function () { return describeModule['default']; }});
  Object.defineProperty(exports, 'describeComponent', { enumerable: true, get: function () { return describeComponent['default']; }});
  Object.defineProperty(exports, 'describeModel', { enumerable: true, get: function () { return describeModel['default']; }});
  Object.defineProperty(exports, 'it', { enumerable: true, get: function () { return it['default']; }});
  Object.defineProperty(exports, 'setResolver', { enumerable: true, get: function () { return ember_test_helpers.setResolver; }});

});
define('ember-mocha/describe-component', ['exports', 'ember-mocha/mocha-module', 'ember-test-helpers'], function (exports, mocha_module, ember_test_helpers) {

  'use strict';

  function describeComponent(name, description, callbacks, tests) {
    mocha_module.createModule(ember_test_helpers.TestModuleForComponent, name, description, callbacks, tests);
  }

  describeComponent.only = mocha_module.createOnly(ember_test_helpers.TestModuleForComponent);

  describeComponent.skip = mocha_module.createSkip(ember_test_helpers.TestModuleForComponent);

  exports['default'] = describeComponent;

});
define('ember-mocha/describe-model', ['exports', 'ember-mocha/mocha-module', 'ember-test-helpers'], function (exports, mocha_module, ember_test_helpers) {

  'use strict';

  function describeModel(name, description, callbacks, tests) {
    mocha_module.createModule(ember_test_helpers.TestModuleForModel, name, description, callbacks, tests);
  }

  describeModel.only = mocha_module.createOnly(ember_test_helpers.TestModuleForModel);

  describeModel.skip = mocha_module.createSkip(ember_test_helpers.TestModuleForModel);

  exports['default'] = describeModel;

});
define('ember-mocha/describe-module', ['exports', 'ember-mocha/mocha-module', 'ember-test-helpers'], function (exports, mocha_module, ember_test_helpers) {

  'use strict';

  function describeModule(name, description, callbacks, tests) {
    mocha_module.createModule(ember_test_helpers.TestModule, name, description, callbacks, tests);
  }

  describeModule.only = mocha_module.createOnly(ember_test_helpers.TestModule);

  describeModule.skip = mocha_module.createSkip(ember_test_helpers.TestModule);

  exports['default'] = describeModule;

});
define('ember-mocha/it', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var originalIt = window.it;

  function wrap(specifier) {
    return function (testName, callback) {
      var wrapper;

      if (!callback) {
        wrapper = null;
      } else if (callback.length === 1) {
        wrapper = function(done) {
          return callback.call(this, done);
        };
      } else {
        wrapper = function() {
          return callback.call(this);
        };
      }

      if (wrapper) {
        wrapper.toString = function() {
          return callback.toString();
        };
      }

      return specifier(testName, wrapper);
    };
  }

  var wrappedIt = wrap(window.it);
  wrappedIt.only = wrap(window.it.only);
  wrappedIt.skip = function(testName, callback) {
    originalIt(testName);
  };

  exports['default'] = wrappedIt;

});
define('ember-mocha/mocha-module', ['exports', 'mocha', 'ember', 'ember-test-helpers'], function (exports, mocha, Ember, ember_test_helpers) {

  'use strict';

  exports.createModule = createModule;
  exports.createOnly = createOnly;
  exports.createSkip = createSkip;

  function createModule(Constructor, name, description, callbacks, tests, method) {
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
      mocha.beforeEach(function() {
        var self = this;
        return module.setup().then(function() {
          var context = ember_test_helpers.getContext();
          var keys = Object.keys(context);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            self[key] = context[key];
          }
        });
      });

      mocha.afterEach(function() {
        return module.teardown();
      });

      tests = tests || function() {};
      tests();
    }
    if (method) {
      mocha.describe[method](module.name, moduleBody);
    } else {
      mocha.describe(module.name, moduleBody);
    }
  }

  function createOnly(Constructor) {
    return function(name, description, callbacks, tests) {
      createModule(Constructor, name, description, callbacks, tests, "only");
    };
  }

  function createSkip(Constructor) {
    return function(name, description, callbacks, tests) {
      createModule(Constructor, name, description, callbacks, tests, "skip");
    };
  }

});
define('ember-test-helpers', ['exports', 'ember', 'ember-test-helpers/test-module', 'ember-test-helpers/test-module-for-component', 'ember-test-helpers/test-module-for-model', 'ember-test-helpers/test-context', 'ember-test-helpers/test-resolver'], function (exports, Ember, TestModule, TestModuleForComponent, TestModuleForModel, test_context, test_resolver) {

  'use strict';

  Object.defineProperty(exports, 'TestModule', { enumerable: true, get: function () { return TestModule['default']; }});
  Object.defineProperty(exports, 'TestModuleForComponent', { enumerable: true, get: function () { return TestModuleForComponent['default']; }});
  Object.defineProperty(exports, 'TestModuleForModel', { enumerable: true, get: function () { return TestModuleForModel['default']; }});
  Object.defineProperty(exports, 'getContext', { enumerable: true, get: function () { return test_context.getContext; }});
  Object.defineProperty(exports, 'setContext', { enumerable: true, get: function () { return test_context.setContext; }});
  Object.defineProperty(exports, 'setResolver', { enumerable: true, get: function () { return test_resolver.setResolver; }});

  Ember['default'].testing = true;

});
define('ember-test-helpers/build-registry', ['exports'], function (exports) {

  'use strict';

  function exposeRegistryMethodsWithoutDeprecations(container) {
    var methods = [
      'register',
      'unregister',
      'resolve',
      'normalize',
      'typeInjection',
      'injection',
      'factoryInjection',
      'factoryTypeInjection',
      'has',
      'options',
      'optionsForType'
    ];

    function exposeRegistryMethod(container, method) {
      if (method in container) {
        container[method] = function() {
          return container._registry[method].apply(container._registry, arguments);
        };
      }
    }

    for (var i = 0, l = methods.length; i < l; i++) {
      exposeRegistryMethod(container, methods[i]);
    }
  }

  exports['default'] = function(resolver) {
    var fallbackRegistry, registry, container;
    var namespace = Ember.Object.create({
      Resolver: { create: function() { return resolver; } }
    });

    function register(name, factory) {
      var thingToRegisterWith = registry || container;

      if (!container.lookupFactory(name)) {
        thingToRegisterWith.register(name, factory);
      }
    }

    if (Ember.Application.buildRegistry) {
      fallbackRegistry = Ember.Application.buildRegistry(namespace);
      fallbackRegistry.register('component-lookup:main', Ember.ComponentLookup);

      registry = new Ember.Registry({
        fallback: fallbackRegistry
      });
      container = registry.container();
      exposeRegistryMethodsWithoutDeprecations(container);
    } else {
      container = Ember.Application.buildContainer(namespace);
      container.register('component-lookup:main', Ember.ComponentLookup);
    }

    // Ember 1.10.0 did not properly add `view:toplevel` or `view:default`
    // to the registry in Ember.Application.buildRegistry :(
    //
    // Ember 2.0.0 removed Ember.View as public API, so only do this when
    // Ember.View is present
    if (Ember.View) {
      register('view:toplevel', Ember.View.extend());
    }

    // Ember 2.0.0 removed Ember._MetamorphView from the Ember global, so only
    // do this when present
    if (Ember._MetamorphView) {
      register('view:default', Ember._MetamorphView);
    }

    var globalContext = typeof global === 'object' && global || self;
    if (globalContext.DS) {
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
  }

});
define('ember-test-helpers/has-ember-version', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  function hasEmberVersion(major, minor) {
    var numbers = Ember['default'].VERSION.split('-')[0].split('.');
    var actualMajor = parseInt(numbers[0], 10);
    var actualMinor = parseInt(numbers[1], 10);
    return actualMajor > major || (actualMajor === major && actualMinor >= minor);
  }
  exports['default'] = hasEmberVersion;

});
define('ember-test-helpers/isolated-container', function () {

	'use strict';

});
define('ember-test-helpers/test-context', ['exports'], function (exports) {

  'use strict';

  exports.setContext = setContext;
  exports.getContext = getContext;
  exports.unsetContext = unsetContext;

  var __test_context__;

  function setContext(context) {
    __test_context__ = context;
  }

  function getContext() {
    return __test_context__;
  }

  function unsetContext() {
    __test_context__ = undefined;
  }

});
define('ember-test-helpers/test-module-for-component', ['exports', 'ember-test-helpers/test-module', 'ember', 'ember-test-helpers/test-resolver'], function (exports, TestModule, Ember, test_resolver) {

  'use strict';

  exports['default'] = TestModule['default'].extend({
    init: function(componentName, description, callbacks) {
      // Allow `description` to be omitted
      if (!callbacks && typeof description === 'object') {
        callbacks = description;
        description = null;
      } else if (!callbacks) {
        callbacks = {};
      }

      this.componentName = componentName;

      if (callbacks.needs || callbacks.unit || callbacks.integration === false) {
        this.isUnitTest = true;
      } else if (callbacks.integration) {
        this.isUnitTest = false;
      } else {
        Ember['default'].deprecate(
          "the component:" + componentName + " test module is implicitly running in unit test mode, " +
          "which will change to integration test mode by default in an upcoming version of " +
          "ember-test-helpers. Add `unit: true` or a `needs:[]` list to explicitly opt in to unit " +
          "test mode.",
          false,
          { id: 'ember-test-helpers.test-module-for-component.test-type', until: '0.6.0' }
        );
        this.isUnitTest = true;
      }

      if (!this.isUnitTest) {
        callbacks.integration = true;
      }

      if (description) {
        this._super.call(this, 'component:' + componentName, description, callbacks);
      } else {
        this._super.call(this, 'component:' + componentName, callbacks);
      }

      if (this.isUnitTest) {
        this.setupSteps.push(this.setupComponentUnitTest);
      } else {
        this.callbacks.subject = function() {
          throw new Error("component integration tests do not support `subject()`.");
        };
        this.setupSteps.push(this.setupComponentIntegrationTest);
        this.teardownSteps.push(this.teardownComponent);
      }

      if (Ember['default'].View && Ember['default'].View.views) {
        this.setupSteps.push(this._aliasViewRegistry);
        this.teardownSteps.push(this._resetViewRegistry);
      }
    },

    _aliasViewRegistry: function() {
      this._originalGlobalViewRegistry = Ember['default'].View.views;
      var viewRegistry = this.container.lookup('-view-registry:main');

      if (viewRegistry) {
        Ember['default'].View.views = viewRegistry;
      }
    },

    _resetViewRegistry: function() {
      Ember['default'].View.views = this._originalGlobalViewRegistry;
    },

    setupComponentUnitTest: function() {
      var _this = this;
      var resolver = test_resolver.getResolver();
      var context = this.context;

      var layoutName = 'template:components/' + this.componentName;

      var layout = resolver.resolve(layoutName);

      var thingToRegisterWith = this.registry || this.container;
      if (layout) {
        thingToRegisterWith.register(layoutName, layout);
        thingToRegisterWith.injection(this.subjectName, 'layout', layoutName);
      }

      context.dispatcher = this.container.lookup('event_dispatcher:main') || Ember['default'].EventDispatcher.create();
      context.dispatcher.setup({}, '#ember-testing');

      this.callbacks.render = function() {
        var subject;

        Ember['default'].run(function(){
          subject = context.subject();
          subject.appendTo('#ember-testing');
        });

        _this.teardownSteps.unshift(function() {
          Ember['default'].run(function() {
            Ember['default'].tryInvoke(subject, 'destroy');
          });
        });
      };

      this.callbacks.append = function() {
        Ember['default'].deprecate(
          'this.append() is deprecated. Please use this.render() or this.$() instead.',
          false,
          { id: 'ember-test-helpers.test-module-for-component.append', until: '0.6.0' }
        );
        return context.$();
      };

      context.$ = function() {
        this.render();
        var subject = this.subject();

        return subject.$.apply(subject, arguments);
      };
    },

    setupComponentIntegrationTest: function() {
      var module = this;
      var context = this.context;

      this.actionHooks = {};

      context.dispatcher = this.container.lookup('event_dispatcher:main') || Ember['default'].EventDispatcher.create();
      context.dispatcher.setup({}, '#ember-testing');
      context.actions = module.actionHooks;

      (this.registry || this.container).register('component:-test-holder', Ember['default'].Component.extend());

      context.render = function(template) {
        if (!template) {
          throw new Error("in a component integration test you must pass a template to `render()`");
        }
        if (Ember['default'].isArray(template)) {
          template = template.join('');
        }
        if (typeof template === 'string') {
          template = Ember['default'].Handlebars.compile(template);
        }
        module.component = module.container.lookupFactory('component:-test-holder').create({
          layout: template
        });

        module.component.set('context' ,context);
        module.component.set('controller', context);

        Ember['default'].run(function() {
          module.component.appendTo('#ember-testing');
        });
      };

      context.$ = function() {
        return module.component.$.apply(module.component, arguments);
      };

      context.set = function(key, value) {
        Ember['default'].run(function() {
          Ember['default'].set(context, key, value);
        });
      };

      context.setProperties = function(hash) {
        Ember['default'].run(function() {
          Ember['default'].setProperties(context, hash);
        });
      };

      context.get = function(key) {
        return Ember['default'].get(context, key);
      };

      context.getProperties = function() {
        var args = Array.prototype.slice.call(arguments);
        return Ember['default'].getProperties(context, args);
      };

      context.on = function(actionName, handler) {
        module.actionHooks[actionName] = handler;
      };
      context.send = function(actionName) {
        var hook = module.actionHooks[actionName];
        if (!hook) {
          throw new Error("integration testing template received unexpected action " + actionName);
        }
        hook.apply(module, Array.prototype.slice.call(arguments, 1));
      };
    },

    setupContext: function() {
      this._super.call(this);

      // only setup the injection if we are running against a version
      // of Ember that has `-view-registry:main` (Ember >= 1.12)
      if (this.container.lookupFactory('-view-registry:main')) {
        (this.registry || this.container).injection('component', '_viewRegistry', '-view-registry:main');
      }

      if (!this.isUnitTest) {
        this.context.factory = function() {};
      }
    },

    teardownComponent: function() {
      var component = this.component;
      if (component) {
        Ember['default'].run(function() {
          component.destroy();
        });
      }
    }
  });

});
define('ember-test-helpers/test-module-for-model', ['exports', 'ember-test-helpers/test-module', 'ember'], function (exports, TestModule, Ember) {

  'use strict';

  exports['default'] = TestModule['default'].extend({
    init: function(modelName, description, callbacks) {
      this.modelName = modelName;

      this._super.call(this, 'model:' + modelName, description, callbacks);

      this.setupSteps.push(this.setupModel);
    },

    setupModel: function() {
      var container = this.container;
      var defaultSubject = this.defaultSubject;
      var callbacks = this.callbacks;
      var modelName = this.modelName;

      var adapterFactory = container.lookupFactory('adapter:application');
      if (!adapterFactory) {
        adapterFactory = DS.JSONAPIAdapter || DS.FixtureAdapter;

        var thingToRegisterWith = this.registry || this.container;
        thingToRegisterWith.register('adapter:application', adapterFactory);
      }

      callbacks.store = function(){
        var container = this.container;
        var store = container.lookup('service:store') || container.lookup('store:main');
        return store;
      };

      if (callbacks.subject === defaultSubject) {
        callbacks.subject = function(options) {
          var container = this.container;

          return Ember['default'].run(function() {
            var store = container.lookup('service:store') || container.lookup('store:main');
            return store.createRecord(modelName, options);
          });
        };
      }
    }
  });

});
define('ember-test-helpers/test-module', ['exports', 'ember', 'ember-test-helpers/test-context', 'klassy', 'ember-test-helpers/test-resolver', 'ember-test-helpers/build-registry', 'ember-test-helpers/has-ember-version'], function (exports, Ember, test_context, klassy, test_resolver, buildRegistry, hasEmberVersion) {

  'use strict';

  exports['default'] = klassy.Klass.extend({
    init: function(subjectName, description, callbacks) {
      // Allow `description` to be omitted, in which case it should
      // default to `subjectName`
      if (!callbacks && typeof description === 'object') {
        callbacks = description;
        description = subjectName;
      }

      this.subjectName = subjectName;
      this.description = description || subjectName;
      this.name = description || subjectName;
      this.callbacks = callbacks || {};

      if (this.callbacks.integration && this.callbacks.needs) {
        throw new Error("cannot declare 'integration: true' and 'needs' in the same module");
      }

      if (this.callbacks.integration) {
        this.isIntegration = callbacks.integration;
        delete callbacks.integration;
      }

      this.initSubject();
      this.initNeeds();
      this.initSetupSteps();
      this.initTeardownSteps();
    },

    initSubject: function() {
      this.callbacks.subject = this.callbacks.subject || this.defaultSubject;
    },

    initNeeds: function() {
      this.needs = [this.subjectName];
      if (this.callbacks.needs) {
        this.needs = this.needs.concat(this.callbacks.needs);
        delete this.callbacks.needs;
      }
    },

    initSetupSteps: function() {
      this.setupSteps = [];
      this.contextualizedSetupSteps = [];

      if (this.callbacks.beforeSetup) {
        this.setupSteps.push( this.callbacks.beforeSetup );
        delete this.callbacks.beforeSetup;
      }

      this.setupSteps.push(this.setupContainer);
      this.setupSteps.push(this.setupContext);
      this.setupSteps.push(this.setupTestElements);

      if (this.callbacks.setup) {
        this.contextualizedSetupSteps.push( this.callbacks.setup );
        delete this.callbacks.setup;
      }
    },

    initTeardownSteps: function() {
      this.teardownSteps = [];
      this.contextualizedTeardownSteps = [];

      if (this.callbacks.teardown) {
        this.contextualizedTeardownSteps.push( this.callbacks.teardown );
        delete this.callbacks.teardown;
      }

      this.teardownSteps.push(this.teardownSubject);
      this.teardownSteps.push(this.teardownContainer);
      this.teardownSteps.push(this.teardownContext);
      this.teardownSteps.push(this.teardownTestElements);

      if (this.callbacks.afterTeardown) {
        this.teardownSteps.push( this.callbacks.afterTeardown );
        delete this.callbacks.afterTeardown;
      }
    },

    setup: function() {
      var self = this;
      return self.invokeSteps(self.setupSteps).then(function() {
        self.contextualizeCallbacks();
        return self.invokeSteps(self.contextualizedSetupSteps, self.context);
      });
    },

    teardown: function() {
      var self = this;
      return self.invokeSteps(self.contextualizedTeardownSteps, self.context).then(function() {
        return self.invokeSteps(self.teardownSteps);
      }).then(function() {
        self.cache = null;
        self.cachedCalls = null;
      });
    },

    invokeSteps: function(steps, _context) {
      var context = _context;
      if (!context) {
        context = this;
      }
      steps = steps.slice();
      function nextStep() {
        var step = steps.shift();
        if (step) {
          // guard against exceptions, for example missing components referenced from needs.
          return new Ember['default'].RSVP.Promise(function(ok) {
            ok(step.call(context));
          }).then(nextStep);
        } else {
          return Ember['default'].RSVP.resolve();
        }
      }
      return nextStep();
    },

    setupContainer: function() {
      if (this.isIntegration) {
        this._setupIntegratedContainer();
      } else {
        this._setupIsolatedContainer();
      }
    },

    setupContext: function() {
      var subjectName = this.subjectName;
      var container = this.container;

      var factory = function() {
        return container.lookupFactory(subjectName);
      };

      test_context.setContext({
        container:  this.container,
        registry: this.registry,
        factory:    factory,
        dispatcher: null,
        register: function() {
          var target = this.registry || this.container;
          return target.register.apply(target, arguments);
        },
        inject: {}
      });

      var context = this.context = test_context.getContext();

      if (Ember['default'].inject) {
        var keys = (Object.keys || Ember['default'].keys)(Ember['default'].inject);
        keys.forEach(function(typeName) {
          context.inject[typeName] = function(name, opts) {
            var alias = (opts && opts.as) || name;
            Ember['default'].set(context, alias, context.container.lookup(typeName + ':' + name));
          };
        });
      }
    },

    setupTestElements: function() {
      if (Ember['default'].$('#ember-testing').length === 0) {
        Ember['default'].$('<div id="ember-testing"/>').appendTo(document.body);
      }
    },

    teardownSubject: function() {
      var subject = this.cache.subject;

      if (subject) {
        Ember['default'].run(function() {
          Ember['default'].tryInvoke(subject, 'destroy');
        });
      }
    },

    teardownContainer: function() {
      var container = this.container;
      Ember['default'].run(function() {
        container.destroy();
      });
    },

    teardownContext: function() {
      var context = this.context;
      this.context = undefined;
      test_context.unsetContext();

      if (context.dispatcher && !context.dispatcher.isDestroyed) {
        Ember['default'].run(function() {
          context.dispatcher.destroy();
        });
      }
    },

    teardownTestElements: function() {
      Ember['default'].$('#ember-testing').empty();

      // Ember 2.0.0 removed Ember.View as public API, so only do this when
      // Ember.View is present
      if (Ember['default'].View && Ember['default'].View.views) {
        Ember['default'].View.views = {};
      }
    },

    defaultSubject: function(options, factory) {
      return factory.create(options);
    },

    // allow arbitrary named factories, like rspec let
    contextualizeCallbacks: function() {
      var _this     = this;
      var callbacks = this.callbacks;
      var context   = this.context;
      var factory   = context.factory;

      this.cache = this.cache || {};
      this.cachedCalls = this.cachedCalls || {};

      var keys = (Object.keys || Ember['default'].keys)(callbacks);

      for (var i = 0, l = keys.length; i < l; i++) {
        (function(key) {

          context[key] = function(options) {
            if (_this.cachedCalls[key]) { return _this.cache[key]; }

            var result = callbacks[key].call(_this, options, factory());

            _this.cache[key] = result;
            _this.cachedCalls[key] = true;

            return result;
          };

        })(keys[i]);
      }
    },

    _setupContainer: function() {
      var resolver = test_resolver.getResolver();
      var items = buildRegistry['default'](resolver);

      this.container = items.container;
      this.registry = items.registry;

      if (hasEmberVersion['default'](1, 13)) {
        var thingToRegisterWith = this.registry || this.container;
        var router = resolver.resolve('router:main');
        router = router || Ember['default'].Router.extend();
        thingToRegisterWith.register('router:main', router);
      }
    },

    _setupIsolatedContainer: function() {
      var resolver = test_resolver.getResolver();
      this._setupContainer();

      var thingToRegisterWith = this.registry || this.container;

      for (var i = this.needs.length; i > 0; i--) {
        var fullName = this.needs[i - 1];
        var normalizedFullName = resolver.normalize(fullName);
        thingToRegisterWith.register(fullName, resolver.resolve(normalizedFullName));
      }

      if (this.registry) {
        this.registry.fallback.resolver = function() {};
      } else {
        this.container.resolver = function() {};
      }
    },

    _setupIntegratedContainer: function() {
      this._setupContainer();
    }

  });

});
define('ember-test-helpers/test-resolver', ['exports'], function (exports) {

  'use strict';

  exports.setResolver = setResolver;
  exports.getResolver = getResolver;

  var __resolver__;

  function setResolver(resolver) {
    __resolver__ = resolver;
  }

  function getResolver() {
    if (__resolver__ == null) throw new Error('you must set a resolver with `testResolver.set(resolver)`');
    return __resolver__;
  }

});
define('klassy', ['exports'], function (exports) {

  'use strict';

  /**
   Extend a class with the properties and methods of one or more other classes.

   When a method is replaced with another method, it will be wrapped in a
   function that makes the replaced method accessible via `this._super`.

   @method extendClass
   @param {Object} destination The class to merge into
   @param {Object} source One or more source classes
   */
  var extendClass = function(destination) {
    var sources = Array.prototype.slice.call(arguments, 1);
    var source;

    for (var i = 0, l = sources.length; i < l; i++) {
      source = sources[i];

      for (var p in source) {
        if (source.hasOwnProperty(p) &&
          destination[p] &&
          typeof destination[p] === 'function' &&
          typeof source[p] === 'function') {

          /* jshint loopfunc:true */
          destination[p] =
            (function(destinationFn, sourceFn) {
              var wrapper = function() {
                var prevSuper = this._super;
                this._super = destinationFn;

                var ret = sourceFn.apply(this, arguments);

                this._super = prevSuper;

                return ret;
              };
              wrapper.wrappedFunction = sourceFn;
              return wrapper;
            })(destination[p], source[p]);

        } else {
          destination[p] = source[p];
        }
      }
    }
  };

  // `subclassing` is a state flag used by `defineClass` to track when a class is
  // being subclassed. It allows constructors to avoid calling `init`, which can
  // be expensive and cause undesirable side effects.
  var subclassing = false;

  /**
   Define a new class with the properties and methods of one or more other classes.

   The new class can be based on a `SuperClass`, which will be inserted into its
   prototype chain.

   Furthermore, one or more mixins (object that contain properties and/or methods)
   may be specified, which will be applied in order. When a method is replaced
   with another method, it will be wrapped in a function that makes the previous
   method accessible via `this._super`.

   @method defineClass
   @param {Object} SuperClass A base class to extend. If `mixins` are to be included
   without a `SuperClass`, pass `null` for SuperClass.
   @param {Object} mixins One or more objects that contain properties and methods
   to apply to the new class.
   */
  var defineClass = function(SuperClass) {
    var Klass = function() {
      if (!subclassing && this.init) {
        this.init.apply(this, arguments);
      }
    };

    if (SuperClass) {
      subclassing = true;
      Klass.prototype = new SuperClass();
      subclassing = false;
    }

    if (arguments.length > 1) {
      var extendArgs = Array.prototype.slice.call(arguments, 1);
      extendArgs.unshift(Klass.prototype);
      extendClass.apply(Klass.prototype, extendArgs);
    }

    Klass.constructor = Klass;

    Klass.extend = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      args.unshift(Klass);
      return defineClass.apply(Klass, args);
    };

    return Klass;
  };

  /**
   A base class that can be extended.

   @example

   ```javascript
   var CelestialObject = Klass.extend({
     init: function(name) {
       this._super();
       this.name = name;
       this.isCelestialObject = true;
     },
     greeting: function() {
       return 'Hello from ' + this.name;
     }
   });

   var Planet = CelestialObject.extend({
     init: function(name) {
       this._super.apply(this, arguments);
       this.isPlanet = true;
     },
     greeting: function() {
       return this._super() + '!';
     },
   });

   var earth = new Planet('Earth');

   console.log(earth instanceof Klass);           // true
   console.log(earth instanceof CelestialObject); // true
   console.log(earth instanceof Planet);          // true

   console.log(earth.isCelestialObject);          // true
   console.log(earth.isPlanet);                   // true

   console.log(earth.greeting());                 // 'Hello from Earth!'
   ```

   @class Klass
   */
  var Klass = defineClass(null, {
    init: function() {}
  });

  exports.Klass = Klass;
  exports.defineClass = defineClass;
  exports.extendClass = extendClass;

});
define('mocha', ['exports'], function (exports) {

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
        return original(function(done) {
          return Ember.run((function(_this) {
            return function() {
              return fn.call(_this, done);
            };
          })(this));
        });
      } else {
        // no done parameter.
        return original(function() {
          return Ember.run((function(_this) {
            return function() {
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