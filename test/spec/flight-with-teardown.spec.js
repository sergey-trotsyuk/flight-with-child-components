define(function (require) {
    'use strict';

    var defineComponent = require('flight/lib/component');
    var withTeardown = require('lib/flight-with-teardown');

    describeMixin('lib/flight-with-teardown', function () {

        var Component = (function () {
            function parentComponent() {}
            return defineComponent(parentComponent, withTeardown);
        })();

        var ChildComponent = (function () {
            function childComponent() {}
            return defineComponent(childComponent, withTeardown);
        })();

        // Initialize the component and attach it to the DOM
        beforeEach(function () {
            window.outerDiv = document.createElement('div');
            window.innerDiv = document.createElement('div');
            window.otherInnerDiv = document.createElement('div');
            window.outerDiv.appendChild(window.innerDiv);
            window.outerDiv.appendChild(window.otherInnerDiv);
            window.outerDiv.id = 'outerDiv';
            window.innerDiv.id = 'innerDiv';
            window.otherInnerDiv.id = 'otherInnerDiv';
            document.body.appendChild(window.outerDiv);
        });

        afterEach(function () {
            document.body.removeChild(window.outerDiv);
            window.outerDiv = null;
            window.innerDiv = null;
            window.otherInnerDiv = null;
            Component.teardownAll();
            ChildComponent.teardownAll();
        });

        describe('as a parent', function () {

            it('should get a childTeardownEvent', function () {
                var component = new Component();
                component.initialize(window.outerDiv);
                expect(component.childTeardownEvent).toBeDefined();
            });

            it('should teardown the child when torn down', function () {
                var parent = new Component();
                parent.initialize(window.outerDiv);
                var child = new ChildComponent();
                child.initialize(window.innerDiv, {
                    teardownOn: parent.childTeardownEvent
                });
                var parentEventSpy = spyOnEvent(document, parent.childTeardownEvent);
                var childEventSpy = spyOnEvent(document, child.childTeardownEvent);
                parent.teardown();
                expect(parentEventSpy).toHaveBeenTriggeredOn(document);
                expect(childEventSpy).toHaveBeenTriggeredOn(document);
            });

            it('should teardown all children when torn down', function () {
                var parent = new Component();
                parent.initialize(window.outerDiv);
                var child = new ChildComponent();
                child.initialize(window.innerDiv, {
                    teardownOn: parent.childTeardownEvent
                });
                var otherChild = new ChildComponent();
                otherChild.initialize(document, {
                    teardownOn: parent.childTeardownEvent
                });
                var parentEventSpy = spyOnEvent(document, parent.childTeardownEvent);
                var childEventSpy = spyOnEvent(document, child.childTeardownEvent);
                var otherChildEventSpy = spyOnEvent(document, otherChild.childTeardownEvent);
                parent.teardown();
                expect(parentEventSpy).toHaveBeenTriggeredOn(document);
                expect(childEventSpy).toHaveBeenTriggeredOn(document);
                expect(otherChildEventSpy).toHaveBeenTriggeredOn(document);
            });

            describe('attachChild', function () {
                it('should attach child with teardownOn', function () {
                    setupComponent();
                    var Component = {
                        attachTo: jasmine.createSpy()
                    };
                    this.component.attachChild(Component, '.my-selector', { test: true });
                    expect(Component.attachTo).toHaveBeenCalledWith('.my-selector', {
                        test: true,
                        teardownOn: this.component.childTeardownEvent
                    });
                });
                it('should not overwrite a passed teardownOn event', function () {
                    setupComponent();
                    var Component = {
                        attachTo: jasmine.createSpy()
                    };
                    this.component.attachChild(Component, '.my-selector', { test: true, teardownOn: 'someTeardownEvent' });
                    expect(Component.attachTo).toHaveBeenCalledWith('.my-selector', {
                        test: true,
                        teardownOn: 'someTeardownEvent'
                    });
                });
            });

        });

        describe('as a child', function () {

            it('should throw when intialized with its own childTeardownEvent', function () {
                spyOn(withTeardown, 'nextTeardownEvent').andReturn('someFakeEvent');
                var child = new ChildComponent();
                expect(function () {
                    child.initialize(document, {
                        teardownOn: 'someFakeEvent'
                    });
                }).toThrow();
            });

            it('should trigger children to teardown when torndown via event', function () {
                var child = new ChildComponent();
                child.initialize(window.innerDiv, {
                    teardownOn: 'aFakeEvent'
                });
                var childEventSpy = spyOnEvent(document, child.childTeardownEvent);
                $(document).trigger('aFakeEvent');
                expect(childEventSpy).toHaveBeenTriggeredOn(document);
            });

        });

    });

});
