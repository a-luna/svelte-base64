
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(html, anchor = null) {
            this.e = element('div');
            this.a = anchor;
            this.u(html);
        }
        m(target, anchor = null) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(target, this.n[i], anchor);
            }
            this.t = target;
        }
        u(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        p(html) {
            this.d();
            this.u(html);
            this.m(this.t, this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.17.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* node_modules/svelma/src/components/Icon.svelte generated by Svelte v3.17.3 */

    const file = "node_modules/svelma/src/components/Icon.svelte";

    function create_fragment(ctx) {
    	let span;
    	let i;
    	let i_class_value;
    	let span_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", i_class_value = "" + (/*newPack*/ ctx[8] + " fa-" + /*icon*/ ctx[0] + " " + /*customClass*/ ctx[2] + " " + /*newCustomSize*/ ctx[6]));
    			add_location(i, file, 53, 2, 1189);
    			attr_dev(span, "class", span_class_value = "icon " + /*size*/ ctx[1] + " " + /*newType*/ ctx[7] + " " + (/*isLeft*/ ctx[4] && "is-left" || "") + " " + (/*isRight*/ ctx[5] && "is-right" || ""));
    			toggle_class(span, "is-clickable", /*isClickable*/ ctx[3]);
    			add_location(span, file, 52, 0, 1046);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);
    			dispose = listen_dev(span, "click", /*click_handler*/ ctx[12], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newPack, icon, customClass, newCustomSize*/ 325 && i_class_value !== (i_class_value = "" + (/*newPack*/ ctx[8] + " fa-" + /*icon*/ ctx[0] + " " + /*customClass*/ ctx[2] + " " + /*newCustomSize*/ ctx[6]))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*size, newType, isLeft, isRight*/ 178 && span_class_value !== (span_class_value = "icon " + /*size*/ ctx[1] + " " + /*newType*/ ctx[7] + " " + (/*isLeft*/ ctx[4] && "is-left" || "") + " " + (/*isRight*/ ctx[5] && "is-right" || ""))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*size, newType, isLeft, isRight, isClickable*/ 186) {
    				toggle_class(span, "is-clickable", /*isClickable*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { type = "" } = $$props;
    	let { pack = "fas" } = $$props;
    	let { icon } = $$props;
    	let { size = "" } = $$props;
    	let { customClass = "" } = $$props;
    	let { customSize = "" } = $$props;
    	let { isClickable = false } = $$props;
    	let { isLeft = false } = $$props;
    	let { isRight = false } = $$props;
    	let newCustomSize = "";
    	let newType = "";

    	const writable_props = [
    		"type",
    		"pack",
    		"icon",
    		"size",
    		"customClass",
    		"customSize",
    		"isClickable",
    		"isLeft",
    		"isRight"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("type" in $$props) $$invalidate(9, type = $$props.type);
    		if ("pack" in $$props) $$invalidate(10, pack = $$props.pack);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(2, customClass = $$props.customClass);
    		if ("customSize" in $$props) $$invalidate(11, customSize = $$props.customSize);
    		if ("isClickable" in $$props) $$invalidate(3, isClickable = $$props.isClickable);
    		if ("isLeft" in $$props) $$invalidate(4, isLeft = $$props.isLeft);
    		if ("isRight" in $$props) $$invalidate(5, isRight = $$props.isRight);
    	};

    	$$self.$capture_state = () => {
    		return {
    			type,
    			pack,
    			icon,
    			size,
    			customClass,
    			customSize,
    			isClickable,
    			isLeft,
    			isRight,
    			newCustomSize,
    			newType,
    			newPack
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(9, type = $$props.type);
    		if ("pack" in $$props) $$invalidate(10, pack = $$props.pack);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(2, customClass = $$props.customClass);
    		if ("customSize" in $$props) $$invalidate(11, customSize = $$props.customSize);
    		if ("isClickable" in $$props) $$invalidate(3, isClickable = $$props.isClickable);
    		if ("isLeft" in $$props) $$invalidate(4, isLeft = $$props.isLeft);
    		if ("isRight" in $$props) $$invalidate(5, isRight = $$props.isRight);
    		if ("newCustomSize" in $$props) $$invalidate(6, newCustomSize = $$props.newCustomSize);
    		if ("newType" in $$props) $$invalidate(7, newType = $$props.newType);
    		if ("newPack" in $$props) $$invalidate(8, newPack = $$props.newPack);
    	};

    	let newPack;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pack*/ 1024) {
    			 $$invalidate(8, newPack = pack || "fas");
    		}

    		if ($$self.$$.dirty & /*customSize, size*/ 2050) {
    			 {
    				if (customSize) $$invalidate(6, newCustomSize = customSize); else {
    					switch (size) {
    						case "is-small":
    							break;
    						case "is-medium":
    							$$invalidate(6, newCustomSize = "fa-lg");
    							break;
    						case "is-large":
    							$$invalidate(6, newCustomSize = "fa-3x");
    							break;
    						default:
    							$$invalidate(6, newCustomSize = "");
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*type*/ 512) {
    			 {
    				if (!type) $$invalidate(7, newType = "");
    				let splitType = [];

    				if (typeof type === "string") {
    					splitType = type.split("-");
    				} else {
    					for (let key in type) {
    						if (type[key]) {
    							splitType = key.split("-");
    							break;
    						}
    					}
    				}

    				if (splitType.length <= 1) $$invalidate(7, newType = ""); else $$invalidate(7, newType = `has-text-${splitType[1]}`);
    			}
    		}
    	};

    	return [
    		icon,
    		size,
    		customClass,
    		isClickable,
    		isLeft,
    		isRight,
    		newCustomSize,
    		newType,
    		newPack,
    		type,
    		pack,
    		customSize,
    		click_handler
    	];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			type: 9,
    			pack: 10,
    			icon: 0,
    			size: 1,
    			customClass: 2,
    			customSize: 11,
    			isClickable: 3,
    			isLeft: 4,
    			isRight: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[0] === undefined && !("icon" in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get type() {
    		return this.$$.ctx[9];
    	}

    	set type(type) {
    		this.$set({ type });
    		flush();
    	}

    	get pack() {
    		return this.$$.ctx[10];
    	}

    	set pack(pack) {
    		this.$set({ pack });
    		flush();
    	}

    	get icon() {
    		return this.$$.ctx[0];
    	}

    	set icon(icon) {
    		this.$set({ icon });
    		flush();
    	}

    	get size() {
    		return this.$$.ctx[1];
    	}

    	set size(size) {
    		this.$set({ size });
    		flush();
    	}

    	get customClass() {
    		return this.$$.ctx[2];
    	}

    	set customClass(customClass) {
    		this.$set({ customClass });
    		flush();
    	}

    	get customSize() {
    		return this.$$.ctx[11];
    	}

    	set customSize(customSize) {
    		this.$set({ customSize });
    		flush();
    	}

    	get isClickable() {
    		return this.$$.ctx[3];
    	}

    	set isClickable(isClickable) {
    		this.$set({ isClickable });
    		flush();
    	}

    	get isLeft() {
    		return this.$$.ctx[4];
    	}

    	set isLeft(isLeft) {
    		this.$set({ isLeft });
    		flush();
    	}

    	get isRight() {
    		return this.$$.ctx[5];
    	}

    	set isRight(isRight) {
    		this.$set({ isRight });
    		flush();
    	}
    }

    /* node_modules/svelma/src/components/Notices.svelte generated by Svelte v3.17.3 */

    const file$1 = "node_modules/svelma/src/components/Notices.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "notices " + /*positionClass*/ ctx[1] + " svelte-uehae7");
    			add_location(div, file$1, 40, 0, 931);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[4](div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*positionClass*/ 2 && div_class_value !== (div_class_value = "notices " + /*positionClass*/ ctx[1] + " svelte-uehae7")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const notices = {};

    function instance$1($$self, $$props, $$invalidate) {
    	let { position = "top" } = $$props;
    	let container;
    	let positionClass;

    	function insert(el) {
    		container.insertAdjacentElement("afterbegin", el);
    	}

    	const writable_props = ["position"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notices> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, container = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("position" in $$props) $$invalidate(2, position = $$props.position);
    	};

    	$$self.$capture_state = () => {
    		return { position, container, positionClass };
    	};

    	$$self.$inject_state = $$props => {
    		if ("position" in $$props) $$invalidate(2, position = $$props.position);
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    		if ("positionClass" in $$props) $$invalidate(1, positionClass = $$props.positionClass);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*position*/ 4) {
    			 $$invalidate(1, positionClass = position === "top" ? "is-top" : "is-bottom");
    		}
    	};

    	return [container, positionClass, position, insert, div_binding];
    }

    class Notices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { position: 2, insert: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notices",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get position() {
    		return this.$$.ctx[2];
    	}

    	set position(position) {
    		this.$set({ position });
    		flush();
    	}

    	get insert() {
    		return this.$$.ctx[3];
    	}

    	set insert(value) {
    		throw new Error("<Notices>: Cannot set read-only property 'insert'");
    	}
    }

    /* node_modules/svelma/src/components/Notice.svelte generated by Svelte v3.17.3 */

    const { Object: Object_1 } = globals;
    const file$2 = "node_modules/svelma/src/components/Notice.svelte";

    // (98:0) {#if active}
    function create_if_block(ctx) {
    	let div;
    	let div_class_value;
    	let div_aria_hidden_value;
    	let div_intro;
    	let div_outro;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "notice " + /*position*/ ctx[1] + " svelte-7qccnv");
    			attr_dev(div, "aria-hidden", div_aria_hidden_value = !/*active*/ ctx[0]);
    			add_location(div, file$2, 98, 2, 2030);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[16](div);
    			current = true;
    			dispose = listen_dev(div, "outroend", /*remove*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 16384) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[14], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, null));
    			}

    			if (!current || dirty & /*position*/ 2 && div_class_value !== (div_class_value = "notice " + /*position*/ ctx[1] + " svelte-7qccnv")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*active*/ 1 && div_aria_hidden_value !== (div_aria_hidden_value = !/*active*/ ctx[0])) {
    				attr_dev(div, "aria-hidden", div_aria_hidden_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { y: /*transitionY*/ ctx[4] });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, fade, {
    				duration: /*transitionOut*/ ctx[2] ? 400 : 0
    			});

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[16](null);
    			if (detaching && div_outro) div_outro.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(98:0) {#if active}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*active*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const allowedProps = ["active", "type", "position", "duration"];

    function filterProps(props) {
    	const newProps = {};

    	Object.keys(props).forEach(key => {
    		if (allowedProps.includes(key)) newProps[key] = props[key];
    	});

    	return newProps;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { active = true } = $$props;
    	let { type = "is-dark" } = $$props;
    	let { position = "is-top" } = $$props;
    	let { duration = 2000 } = $$props;
    	let { transitionOut = true } = $$props;
    	let el;
    	let parent;
    	let timer;

    	function close() {
    		$$invalidate(0, active = false);
    	}

    	function remove() {
    		clearTimeout(timer);

    		// Just making sure
    		$$invalidate(0, active = false);

    		dispatch("destroyed");
    	}

    	async function setupContainers() {
    		await tick;

    		if (!notices.top) {
    			notices.top = new Notices({
    					target: document.body,
    					props: { position: "top" }
    				});
    		}

    		if (!notices.bottom) {
    			notices.bottom = new Notices({
    					target: document.body,
    					props: { position: "bottom" }
    				});
    		}
    	}

    	function chooseParent() {
    		parent = notices.top;
    		if (position && position.indexOf("is-bottom") === 0) parent = notices.bottom;
    		parent.insert(el);
    	}

    	onMount(async () => {
    		await setupContainers();
    		chooseParent();

    		timer = setTimeout(
    			() => {
    				close();
    			},
    			duration
    		);
    	});

    	const writable_props = ["active", "type", "position", "duration", "transitionOut"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notice> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, el = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("type" in $$props) $$invalidate(6, type = $$props.type);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("duration" in $$props) $$invalidate(7, duration = $$props.duration);
    		if ("transitionOut" in $$props) $$invalidate(2, transitionOut = $$props.transitionOut);
    		if ("$$scope" in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			active,
    			type,
    			position,
    			duration,
    			transitionOut,
    			el,
    			parent,
    			timer,
    			transitionY
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("type" in $$props) $$invalidate(6, type = $$props.type);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("duration" in $$props) $$invalidate(7, duration = $$props.duration);
    		if ("transitionOut" in $$props) $$invalidate(2, transitionOut = $$props.transitionOut);
    		if ("el" in $$props) $$invalidate(3, el = $$props.el);
    		if ("parent" in $$props) parent = $$props.parent;
    		if ("timer" in $$props) timer = $$props.timer;
    		if ("transitionY" in $$props) $$invalidate(4, transitionY = $$props.transitionY);
    	};

    	let transitionY;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*position*/ 2) {
    			 $$invalidate(4, transitionY = ~position.indexOf("is-top") ? -200 : 200);
    		}
    	};

    	return [
    		active,
    		position,
    		transitionOut,
    		el,
    		transitionY,
    		remove,
    		type,
    		duration,
    		close,
    		parent,
    		timer,
    		dispatch,
    		setupContainers,
    		chooseParent,
    		$$scope,
    		$$slots,
    		div_binding
    	];
    }

    class Notice extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			active: 0,
    			type: 6,
    			position: 1,
    			duration: 7,
    			transitionOut: 2,
    			close: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notice",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get active() {
    		return this.$$.ctx[0];
    	}

    	set active(active) {
    		this.$set({ active });
    		flush();
    	}

    	get type() {
    		return this.$$.ctx[6];
    	}

    	set type(type) {
    		this.$set({ type });
    		flush();
    	}

    	get position() {
    		return this.$$.ctx[1];
    	}

    	set position(position) {
    		this.$set({ position });
    		flush();
    	}

    	get duration() {
    		return this.$$.ctx[7];
    	}

    	set duration(duration) {
    		this.$set({ duration });
    		flush();
    	}

    	get transitionOut() {
    		return this.$$.ctx[2];
    	}

    	set transitionOut(transitionOut) {
    		this.$set({ transitionOut });
    		flush();
    	}

    	get close() {
    		return this.$$.ctx[8];
    	}

    	set close(value) {
    		throw new Error("<Notice>: Cannot set read-only property 'close'");
    	}
    }

    function omit(obj, ...keysToOmit) {
      return Object.keys(obj).reduce((acc, key) => {
        if (keysToOmit.indexOf(key) === -1) acc[key] = obj[key];
        return acc
      }, {})
    }

    function typeToIcon(type) {
      switch (type) {
        case 'is-info':
          return 'info-circle'
        case 'is-success':
          return 'check-circle'
        case 'is-warning':
          return 'exclamation-triangle'
        case 'is-danger':
          return 'exclamation-circle'
        default:
          return null
      }
    }

    /* node_modules/svelma/src/components/Notification/Notification.svelte generated by Svelte v3.17.3 */
    const file$3 = "node_modules/svelma/src/components/Notification/Notification.svelte";

    // (93:0) {#if active}
    function create_if_block$1(ctx) {
    	let article;
    	let t0;
    	let div1;
    	let t1;
    	let div0;
    	let article_class_value;
    	let article_transition;
    	let current;
    	let if_block0 = /*showClose*/ ctx[2] && create_if_block_2(ctx);
    	let if_block1 = /*icon*/ ctx[3] && create_if_block_1(ctx);
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);

    	const block = {
    		c: function create() {
    			article = element("article");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "media-content");
    			add_location(div0, file$3, 103, 6, 2899);
    			attr_dev(div1, "class", "media svelte-keoo2o");
    			add_location(div1, file$3, 97, 4, 2730);
    			attr_dev(article, "class", article_class_value = "notification " + /*type*/ ctx[1] + " svelte-keoo2o");
    			add_location(article, file$3, 93, 2, 2559);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			if (if_block0) if_block0.m(article, null);
    			append_dev(article, t0);
    			append_dev(article, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*showClose*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(article, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*icon*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4096) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
    			}

    			if (!current || dirty & /*type*/ 2 && article_class_value !== (article_class_value = "notification " + /*type*/ ctx[1] + " svelte-keoo2o")) {
    				attr_dev(article, "class", article_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(default_slot, local);

    			if (local) {
    				add_render_callback(() => {
    					if (!article_transition) article_transition = create_bidirectional_transition(article, fade, {}, true);
    					article_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(default_slot, local);

    			if (local) {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, fade, {}, false);
    				article_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && article_transition) article_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(93:0) {#if active}",
    		ctx
    	});

    	return block;
    }

    // (95:4) {#if showClose}
    function create_if_block_2(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "delete");
    			attr_dev(button, "aria-label", /*ariaCloseLabel*/ ctx[5]);
    			add_location(button, file$3, 95, 6, 2645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			dispose = listen_dev(button, "click", /*close*/ ctx[7], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ariaCloseLabel*/ 32) {
    				attr_dev(button, "aria-label", /*ariaCloseLabel*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(95:4) {#if showClose}",
    		ctx
    	});

    	return block;
    }

    // (99:6) {#if icon}
    function create_if_block_1(ctx) {
    	let div;
    	let current;

    	const icon_1 = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[4],
    				icon: /*newIcon*/ ctx[6],
    				size: "is-large"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(icon_1.$$.fragment);
    			attr_dev(div, "class", "media-left");
    			add_location(div, file$3, 99, 8, 2775);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(icon_1, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty & /*iconPack*/ 16) icon_1_changes.pack = /*iconPack*/ ctx[4];
    			if (dirty & /*newIcon*/ 64) icon_1_changes.icon = /*newIcon*/ ctx[6];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(99:6) {#if icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*active*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { type = "" } = $$props;
    	let { active = true } = $$props;
    	let { showClose = true } = $$props;
    	let { autoClose = false } = $$props;
    	let { duration = 2000 } = $$props;
    	let { icon = "" } = $$props;
    	let { iconPack = "" } = $$props;
    	let { ariaCloseLabel = "" } = $$props;

    	/** Text for notification, when used programmatically
     * @svelte-prop {String} message
     * */
    	/** Where the notification will show on the screen when used programmatically
     * @svelte-prop {String} [position=is-top-right]
     * @values <code>is-top</code>, <code>is-bottom</code>, <code>is-top-left</code>, <code>is-top-right</code>, <code>is-bottom-left</code>, <code>is-bottom-right</code>
     * */
    	const dispatch = createEventDispatcher();

    	let newIcon = "";
    	let timer;

    	function close() {
    		$$invalidate(0, active = false);
    		if (timer) clearTimeout(timer);
    		dispatch("close", active);
    	}

    	const writable_props = [
    		"type",
    		"active",
    		"showClose",
    		"autoClose",
    		"duration",
    		"icon",
    		"iconPack",
    		"ariaCloseLabel"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notification> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("showClose" in $$props) $$invalidate(2, showClose = $$props.showClose);
    		if ("autoClose" in $$props) $$invalidate(8, autoClose = $$props.autoClose);
    		if ("duration" in $$props) $$invalidate(9, duration = $$props.duration);
    		if ("icon" in $$props) $$invalidate(3, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(4, iconPack = $$props.iconPack);
    		if ("ariaCloseLabel" in $$props) $$invalidate(5, ariaCloseLabel = $$props.ariaCloseLabel);
    		if ("$$scope" in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			type,
    			active,
    			showClose,
    			autoClose,
    			duration,
    			icon,
    			iconPack,
    			ariaCloseLabel,
    			newIcon,
    			timer
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("showClose" in $$props) $$invalidate(2, showClose = $$props.showClose);
    		if ("autoClose" in $$props) $$invalidate(8, autoClose = $$props.autoClose);
    		if ("duration" in $$props) $$invalidate(9, duration = $$props.duration);
    		if ("icon" in $$props) $$invalidate(3, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(4, iconPack = $$props.iconPack);
    		if ("ariaCloseLabel" in $$props) $$invalidate(5, ariaCloseLabel = $$props.ariaCloseLabel);
    		if ("newIcon" in $$props) $$invalidate(6, newIcon = $$props.newIcon);
    		if ("timer" in $$props) timer = $$props.timer;
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon, type*/ 10) {
    			 {
    				if (icon === true) {
    					$$invalidate(6, newIcon = typeToIcon(type));
    				} else {
    					$$invalidate(6, newIcon = icon);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*active, autoClose, duration*/ 769) {
    			 {
    				if (active && autoClose) {
    					timer = setTimeout(
    						() => {
    							if (active) close();
    						},
    						duration
    					);
    				}
    			}
    		}
    	};

    	return [
    		active,
    		type,
    		showClose,
    		icon,
    		iconPack,
    		ariaCloseLabel,
    		newIcon,
    		close,
    		autoClose,
    		duration,
    		timer,
    		dispatch,
    		$$scope,
    		$$slots
    	];
    }

    class Notification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			type: 1,
    			active: 0,
    			showClose: 2,
    			autoClose: 8,
    			duration: 9,
    			icon: 3,
    			iconPack: 4,
    			ariaCloseLabel: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get type() {
    		return this.$$.ctx[1];
    	}

    	set type(type) {
    		this.$set({ type });
    		flush();
    	}

    	get active() {
    		return this.$$.ctx[0];
    	}

    	set active(active) {
    		this.$set({ active });
    		flush();
    	}

    	get showClose() {
    		return this.$$.ctx[2];
    	}

    	set showClose(showClose) {
    		this.$set({ showClose });
    		flush();
    	}

    	get autoClose() {
    		return this.$$.ctx[8];
    	}

    	set autoClose(autoClose) {
    		this.$set({ autoClose });
    		flush();
    	}

    	get duration() {
    		return this.$$.ctx[9];
    	}

    	set duration(duration) {
    		this.$set({ duration });
    		flush();
    	}

    	get icon() {
    		return this.$$.ctx[3];
    	}

    	set icon(icon) {
    		this.$set({ icon });
    		flush();
    	}

    	get iconPack() {
    		return this.$$.ctx[4];
    	}

    	set iconPack(iconPack) {
    		this.$set({ iconPack });
    		flush();
    	}

    	get ariaCloseLabel() {
    		return this.$$.ctx[5];
    	}

    	set ariaCloseLabel(ariaCloseLabel) {
    		this.$set({ ariaCloseLabel });
    		flush();
    	}
    }

    /* node_modules/svelma/src/components/Notification/NotificationNotice.svelte generated by Svelte v3.17.3 */

    // (34:2) <Notification {...notificationProps}>
    function create_default_slot_1(ctx) {
    	let html_tag;

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag(/*message*/ ctx[0], null);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(target, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 1) html_tag.p(/*message*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(34:2) <Notification {...notificationProps}>",
    		ctx
    	});

    	return block;
    }

    // (33:0) <Notice {...props} transitionOut={true}>
    function create_default_slot(ctx) {
    	let current;
    	const notification_spread_levels = [/*notificationProps*/ ctx[2]];

    	let notification_props = {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < notification_spread_levels.length; i += 1) {
    		notification_props = assign(notification_props, notification_spread_levels[i]);
    	}

    	const notification = new Notification({
    			props: notification_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(notification.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(notification, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const notification_changes = (dirty & /*notificationProps*/ 4)
    			? get_spread_update(notification_spread_levels, [get_spread_object(/*notificationProps*/ ctx[2])])
    			: {};

    			if (dirty & /*$$scope, message*/ 129) {
    				notification_changes.$$scope = { dirty, ctx };
    			}

    			notification.$set(notification_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notification, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(33:0) <Notice {...props} transitionOut={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current;
    	const notice_spread_levels = [/*props*/ ctx[1], { transitionOut: true }];

    	let notice_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < notice_spread_levels.length; i += 1) {
    		notice_props = assign(notice_props, notice_spread_levels[i]);
    	}

    	const notice = new Notice({ props: notice_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(notice.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(notice, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const notice_changes = (dirty & /*props*/ 2)
    			? get_spread_update(notice_spread_levels, [get_spread_object(/*props*/ ctx[1]), notice_spread_levels[1]])
    			: {};

    			if (dirty & /*$$scope, notificationProps, message*/ 133) {
    				notice_changes.$$scope = { dirty, ctx };
    			}

    			notice.$set(notice_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notice.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notice.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notice, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { message } = $$props;
    	let { duration = 2000 } = $$props;
    	let { position = "is-top-right" } = $$props;

    	function removeNonNoficationProps(props) {
    		const newProps = {};
    		const blacklist = ["duration", "message", "position"];

    		Object.keys(props).forEach(key => {
    			if (!blacklist.includes(key)) newProps[key] = props[key];
    		});

    		return newProps;
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(6, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("message" in $$new_props) $$invalidate(0, message = $$new_props.message);
    		if ("duration" in $$new_props) $$invalidate(3, duration = $$new_props.duration);
    		if ("position" in $$new_props) $$invalidate(4, position = $$new_props.position);
    	};

    	$$self.$capture_state = () => {
    		return {
    			message,
    			duration,
    			position,
    			props,
    			notificationProps
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(6, $$props = assign(assign({}, $$props), $$new_props));
    		if ("message" in $$props) $$invalidate(0, message = $$new_props.message);
    		if ("duration" in $$props) $$invalidate(3, duration = $$new_props.duration);
    		if ("position" in $$props) $$invalidate(4, position = $$new_props.position);
    		if ("props" in $$props) $$invalidate(1, props = $$new_props.props);
    		if ("notificationProps" in $$props) $$invalidate(2, notificationProps = $$new_props.notificationProps);
    	};

    	let props;
    	let notificationProps;

    	$$self.$$.update = () => {
    		 $$invalidate(1, props = {
    			...filterProps($$props),
    			duration,
    			position
    		});

    		 $$invalidate(2, notificationProps = { ...removeNonNoficationProps($$props) });
    	};

    	$$props = exclude_internal_props($$props);
    	return [message, props, notificationProps, duration, position];
    }

    class NotificationNotice extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { message: 0, duration: 3, position: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotificationNotice",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !("message" in props)) {
    			console.warn("<NotificationNotice> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		return this.$$.ctx[0];
    	}

    	set message(message) {
    		this.$set({ message });
    		flush();
    	}

    	get duration() {
    		return this.$$.ctx[3];
    	}

    	set duration(duration) {
    		this.$set({ duration });
    		flush();
    	}

    	get position() {
    		return this.$$.ctx[4];
    	}

    	set position(position) {
    		this.$set({ position });
    		flush();
    	}
    }

    Notification.create = create;

    function create(props) {
      if (typeof props === 'string') props = { message: props };

      const notification = new NotificationNotice({
        target: document.body,
        props,
        intro: true,
      });

      notification.$on('destroyed', notification.$destroy);

      return notification
    }

    /* node_modules/svelma/src/components/Button.svelte generated by Svelte v3.17.3 */

    const { Error: Error_1 } = globals;
    const file$4 = "node_modules/svelma/src/components/Button.svelte";

    // (85:22) 
    function create_if_block_3(ctx) {
    	let a;
    	let t0;
    	let span;
    	let t1;
    	let current;
    	let dispose;
    	let if_block0 = /*iconLeft*/ ctx[7] && create_if_block_5(ctx);
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);
    	let if_block1 = /*iconRight*/ ctx[8] && create_if_block_4(ctx);
    	let a_levels = [{ href: /*href*/ ctx[1] }, /*props*/ ctx[11]];
    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			add_location(span, file$4, 96, 4, 2314);
    			set_attributes(a, a_data);
    			toggle_class(a, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(a, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(a, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(a, "is-rounded", /*rounded*/ ctx[6]);
    			add_location(a, file$4, 85, 2, 2047);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if (if_block0) if_block0.m(a, null);
    			append_dev(a, t0);
    			append_dev(a, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(a, t1);
    			if (if_block1) if_block1.m(a, null);
    			current = true;
    			dispose = listen_dev(a, "click", /*click_handler_1*/ ctx[18], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (/*iconLeft*/ ctx[7]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(a, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}

    			if (/*iconRight*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(a, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*href*/ 2 && { href: /*href*/ ctx[1] },
    				dirty & /*props*/ 2048 && /*props*/ ctx[11]
    			]));

    			toggle_class(a, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(a, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(a, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(a, "is-rounded", /*rounded*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(85:22) ",
    		ctx
    	});

    	return block;
    }

    // (66:0) {#if tag === 'button'}
    function create_if_block$2(ctx) {
    	let button;
    	let t0;
    	let span;
    	let t1;
    	let current;
    	let dispose;
    	let if_block0 = /*iconLeft*/ ctx[7] && create_if_block_2$1(ctx);
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);
    	let if_block1 = /*iconRight*/ ctx[8] && create_if_block_1$1(ctx);
    	let button_levels = [/*props*/ ctx[11], { type: /*nativeType*/ ctx[2] }];
    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			add_location(span, file$4, 77, 4, 1882);
    			set_attributes(button, button_data);
    			toggle_class(button, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(button, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(button, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(button, "is-rounded", /*rounded*/ ctx[6]);
    			add_location(button, file$4, 66, 2, 1599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(button, t1);
    			if (if_block1) if_block1.m(button, null);
    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[17], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (/*iconLeft*/ ctx[7]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}

    			if (/*iconRight*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(button, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				dirty & /*props*/ 2048 && /*props*/ ctx[11],
    				dirty & /*nativeType*/ 4 && { type: /*nativeType*/ ctx[2] }
    			]));

    			toggle_class(button, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(button, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(button, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(button, "is-rounded", /*rounded*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(66:0) {#if tag === 'button'}",
    		ctx
    	});

    	return block;
    }

    // (94:4) {#if iconLeft}
    function create_if_block_5(ctx) {
    	let current;

    	const icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconLeft*/ ctx[7],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconLeft*/ 128) icon_changes.icon = /*iconLeft*/ ctx[7];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(94:4) {#if iconLeft}",
    		ctx
    	});

    	return block;
    }

    // (100:4) {#if iconRight}
    function create_if_block_4(ctx) {
    	let current;

    	const icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconRight*/ ctx[8],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconRight*/ 256) icon_changes.icon = /*iconRight*/ ctx[8];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(100:4) {#if iconRight}",
    		ctx
    	});

    	return block;
    }

    // (75:4) {#if iconLeft}
    function create_if_block_2$1(ctx) {
    	let current;

    	const icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconLeft*/ ctx[7],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconLeft*/ 128) icon_changes.icon = /*iconLeft*/ ctx[7];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(75:4) {#if iconLeft}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if iconRight}
    function create_if_block_1$1(ctx) {
    	let current;

    	const icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconRight*/ ctx[8],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconRight*/ 256) icon_changes.icon = /*iconRight*/ ctx[8];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(81:4) {#if iconRight}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tag*/ ctx[0] === "button") return 0;
    		if (/*tag*/ ctx[0] === "a") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { tag = "button" } = $$props;
    	let { type = "" } = $$props;
    	let { size = "" } = $$props;
    	let { href = "" } = $$props;
    	let { nativeType = "button" } = $$props;
    	let { loading = false } = $$props;
    	let { inverted = false } = $$props;
    	let { outlined = false } = $$props;
    	let { rounded = false } = $$props;
    	let { iconLeft = null } = $$props;
    	let { iconRight = null } = $$props;
    	let { iconPack = null } = $$props;
    	let iconSize = "";

    	onMount(() => {
    		if (!["button", "a"].includes(tag)) throw new Error(`'${tag}' cannot be used as a tag for a Bulma button`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(14, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("tag" in $$new_props) $$invalidate(0, tag = $$new_props.tag);
    		if ("type" in $$new_props) $$invalidate(12, type = $$new_props.type);
    		if ("size" in $$new_props) $$invalidate(13, size = $$new_props.size);
    		if ("href" in $$new_props) $$invalidate(1, href = $$new_props.href);
    		if ("nativeType" in $$new_props) $$invalidate(2, nativeType = $$new_props.nativeType);
    		if ("loading" in $$new_props) $$invalidate(3, loading = $$new_props.loading);
    		if ("inverted" in $$new_props) $$invalidate(4, inverted = $$new_props.inverted);
    		if ("outlined" in $$new_props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("rounded" in $$new_props) $$invalidate(6, rounded = $$new_props.rounded);
    		if ("iconLeft" in $$new_props) $$invalidate(7, iconLeft = $$new_props.iconLeft);
    		if ("iconRight" in $$new_props) $$invalidate(8, iconRight = $$new_props.iconRight);
    		if ("iconPack" in $$new_props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("$$scope" in $$new_props) $$invalidate(15, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			tag,
    			type,
    			size,
    			href,
    			nativeType,
    			loading,
    			inverted,
    			outlined,
    			rounded,
    			iconLeft,
    			iconRight,
    			iconPack,
    			iconSize,
    			props
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(14, $$props = assign(assign({}, $$props), $$new_props));
    		if ("tag" in $$props) $$invalidate(0, tag = $$new_props.tag);
    		if ("type" in $$props) $$invalidate(12, type = $$new_props.type);
    		if ("size" in $$props) $$invalidate(13, size = $$new_props.size);
    		if ("href" in $$props) $$invalidate(1, href = $$new_props.href);
    		if ("nativeType" in $$props) $$invalidate(2, nativeType = $$new_props.nativeType);
    		if ("loading" in $$props) $$invalidate(3, loading = $$new_props.loading);
    		if ("inverted" in $$props) $$invalidate(4, inverted = $$new_props.inverted);
    		if ("outlined" in $$props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("rounded" in $$props) $$invalidate(6, rounded = $$new_props.rounded);
    		if ("iconLeft" in $$props) $$invalidate(7, iconLeft = $$new_props.iconLeft);
    		if ("iconRight" in $$props) $$invalidate(8, iconRight = $$new_props.iconRight);
    		if ("iconPack" in $$props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("iconSize" in $$props) $$invalidate(10, iconSize = $$new_props.iconSize);
    		if ("props" in $$props) $$invalidate(11, props = $$new_props.props);
    	};

    	let props;

    	$$self.$$.update = () => {
    		 $$invalidate(11, props = {
    			...omit($$props, "loading", "inverted", "nativeType", "outlined", "rounded", "type"),
    			class: `button ${type} ${size} ${$$props.class || ""}`
    		});

    		if ($$self.$$.dirty & /*size*/ 8192) {
    			 {
    				if (!size || size === "is-medium") {
    					$$invalidate(10, iconSize = "is-small");
    				} else if (size === "is-large") {
    					$$invalidate(10, iconSize = "is-medium");
    				} else {
    					$$invalidate(10, iconSize = size);
    				}
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		tag,
    		href,
    		nativeType,
    		loading,
    		inverted,
    		outlined,
    		rounded,
    		iconLeft,
    		iconRight,
    		iconPack,
    		iconSize,
    		props,
    		type,
    		size,
    		$$props,
    		$$scope,
    		$$slots,
    		click_handler,
    		click_handler_1
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			tag: 0,
    			type: 12,
    			size: 13,
    			href: 1,
    			nativeType: 2,
    			loading: 3,
    			inverted: 4,
    			outlined: 5,
    			rounded: 6,
    			iconLeft: 7,
    			iconRight: 8,
    			iconPack: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get tag() {
    		return this.$$.ctx[0];
    	}

    	set tag(tag) {
    		this.$set({ tag });
    		flush();
    	}

    	get type() {
    		return this.$$.ctx[12];
    	}

    	set type(type) {
    		this.$set({ type });
    		flush();
    	}

    	get size() {
    		return this.$$.ctx[13];
    	}

    	set size(size) {
    		this.$set({ size });
    		flush();
    	}

    	get href() {
    		return this.$$.ctx[1];
    	}

    	set href(href) {
    		this.$set({ href });
    		flush();
    	}

    	get nativeType() {
    		return this.$$.ctx[2];
    	}

    	set nativeType(nativeType) {
    		this.$set({ nativeType });
    		flush();
    	}

    	get loading() {
    		return this.$$.ctx[3];
    	}

    	set loading(loading) {
    		this.$set({ loading });
    		flush();
    	}

    	get inverted() {
    		return this.$$.ctx[4];
    	}

    	set inverted(inverted) {
    		this.$set({ inverted });
    		flush();
    	}

    	get outlined() {
    		return this.$$.ctx[5];
    	}

    	set outlined(outlined) {
    		this.$set({ outlined });
    		flush();
    	}

    	get rounded() {
    		return this.$$.ctx[6];
    	}

    	set rounded(rounded) {
    		this.$set({ rounded });
    		flush();
    	}

    	get iconLeft() {
    		return this.$$.ctx[7];
    	}

    	set iconLeft(iconLeft) {
    		this.$set({ iconLeft });
    		flush();
    	}

    	get iconRight() {
    		return this.$$.ctx[8];
    	}

    	set iconRight(iconRight) {
    		this.$set({ iconRight });
    		flush();
    	}

    	get iconPack() {
    		return this.$$.ctx[9];
    	}

    	set iconPack(iconPack) {
    		this.$set({ iconPack });
    		flush();
    	}
    }

    /* src/components/FormTitle.svelte generated by Svelte v3.17.3 */
    const file$5 = "src/components/FormTitle.svelte";

    // (81:4) {:else}
    function create_else_block(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				type: "green",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*toggleForm*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(81:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (79:4) {#if showEncodeForm}
    function create_if_block$3(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				type: "blue",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*toggleForm*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(79:4) {#if showEncodeForm}",
    		ctx
    	});

    	return block;
    }

    // (82:6) <Button type="green" on:click={toggleForm}>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Switch Mode");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(82:6) <Button type=\\\"green\\\" on:click={toggleForm}>",
    		ctx
    	});

    	return block;
    }

    // (80:6) <Button type="blue" on:click={toggleForm}>
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Switch Mode");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(80:6) <Button type=\\\"blue\\\" on:click={toggleForm}>",
    		ctx
    	});

    	return block;
    }

    // (84:4) <Button type="reset" on:click={() => dispatch("resetForm")}>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Reset");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(84:4) <Button type=\\\"reset\\\" on:click={() => dispatch(\\\"resetForm\\\")}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let t2;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block$3, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*showEncodeForm*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const button = new Button({
    			props: {
    				type: "reset",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(/*formTitle*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			if_block.c();
    			t2 = space();
    			create_component(button.$$.fragment);
    			attr_dev(div0, "class", "form-title svelte-129oqax");
    			toggle_class(div0, "blue", /*showEncodeForm*/ ctx[1]);
    			toggle_class(div0, "green", !/*showEncodeForm*/ ctx[1]);
    			add_location(div0, file$5, 69, 2, 1513);
    			attr_dev(div1, "class", "form-title-buttons svelte-129oqax");
    			add_location(div1, file$5, 77, 2, 1664);
    			attr_dev(div2, "class", "form-title-wrapper svelte-129oqax");
    			add_location(div2, file$5, 68, 0, 1478);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(div1, t2);
    			mount_component(button, div1, null);
    			current = true;
    			dispose = listen_dev(div0, "click", /*toggleForm*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*formTitle*/ 1) set_data_dev(t0, /*formTitle*/ ctx[0]);

    			if (dirty & /*showEncodeForm*/ 2) {
    				toggle_class(div0, "blue", /*showEncodeForm*/ ctx[1]);
    			}

    			if (dirty & /*showEncodeForm*/ 2) {
    				toggle_class(div0, "green", !/*showEncodeForm*/ ctx[1]);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div1, t2);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let formTitle = "Encode Text/Data";
    	let showEncodeForm = true;

    	function toggleForm(event) {
    		$$invalidate(1, showEncodeForm = !showEncodeForm);
    		$$invalidate(0, formTitle = showEncodeForm ? "Encode Text/Data" : "Decode Base64");
    		dispatch("formToggled", { value: showEncodeForm });
    	}

    	const click_handler = () => dispatch("resetForm");

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("formTitle" in $$props) $$invalidate(0, formTitle = $$props.formTitle);
    		if ("showEncodeForm" in $$props) $$invalidate(1, showEncodeForm = $$props.showEncodeForm);
    	};

    	return [formTitle, showEncodeForm, dispatch, toggleForm, click_handler];
    }

    class FormTitle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormTitle",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const B64_ALPHABET_COMMON =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const BIN_TO_HEX = {
      "0000": "0",
      "0001": "1",
      "0010": "2",
      "0011": "3",
      "0100": "4",
      "0101": "5",
      "0110": "6",
      "0111": "7",
      "1000": "8",
      "1001": "9",
      "1010": "A",
      "1011": "B",
      "1100": "C",
      "1101": "D",
      "1110": "E",
      "1111": "F",
    };

    function getAsciiPrintableMap() {
      let asciiMap = [];
      for (let i = 32; i < 127; i++) {
        let bin = i.toString(2);
        const padLength = 8 - bin.length;
        bin = `${"0".repeat(padLength)}${bin}`;
        let binWord1 = bin.substring(0, 4);
        let binWord2 = bin.substring(4, 8);
        let hex = `${BIN_TO_HEX[binWord1]}${BIN_TO_HEX[binWord2]}`;
        asciiMap.push({
          ascii: String.fromCharCode(i),
          hex: hex,
          binWord1: binWord1,
          binWord2: binWord2,
          bin: bin,
          dec: i,
        });
      }
      return makeChunkedList(asciiMap, 32)
    }

    function getBase64Map(base64Encoding) {
      let base64Alphabet = getBase64Alphabet(base64Encoding);
      let base64Map = [];
      base64Alphabet.split("").forEach((b64, index) => {
        let byteString = index.toString(2);
        const padLength = 6 - byteString.length;
        byteString = `${"0".repeat(padLength)}${byteString}`;
        base64Map.push({
          b64: b64,
          bin: byteString,
          dec: index,
        });
      });
      base64Map.push({
        b64: "=",
        bin: "------",
        dec: "--",
      });
      return makeChunkedList(base64Map, 26)
    }

    function makeChunkedList(inputList, chunkSize) {
      let chunkedList = [];
      let totalChunks = (inputList.length / chunkSize) | 0;
      let lastChunkIsUneven = inputList.length % chunkSize > 0;
      if (lastChunkIsUneven) {
        totalChunks += 1;
      }
      for (let i = 0; i < totalChunks; i++) {
        let start = i * chunkSize;
        let end = start + chunkSize;
        if (lastChunkIsUneven && i === totalChunks - 1) {
          end = inputList.length;
        }
        chunkedList.push(inputList.slice(start, end));
      }
      return chunkedList
    }

    function validateEncodeFormData(inputText, inputEncoding, base64Encoding) {
      if (inputEncoding == "Hex" && /^0x\w+$/.test(inputText)) {
        inputText = inputText.replace(/0x/, "");
      }
      let { inputIsValid, errorMessage, inputBytes } = validateTextEncoding(
        inputText,
        inputEncoding
      );
      if (!inputIsValid) {
        return [{ inputIsValid: false, errorMessage: errorMessage }, {}]
      }
      const totalBytes = inputBytes.length;
      let totalChunks = (totalBytes / 3) | 0;
      const lastChunkLength = totalBytes % 3;
      let lastChunkPadded = false;
      let padLength = 0;
      if (lastChunkLength > 0) {
        totalChunks += 1;
        lastChunkPadded = true;
        padLength = (3 - lastChunkLength) * 2;
      }
      const inputData = {
        inputText: inputText,
        inputBytes: inputBytes,
        inputEncoding: inputEncoding,
        base64Encoding: base64Encoding,
        totalBytes: totalBytes,
        totalChunks: totalChunks,
        lastChunkPadded: lastChunkPadded,
        lastChunkLength: lastChunkLength,
        padLength: padLength,
      };
      return [{ inputIsValid: true, errorMessage: "" }, inputData]

      function validateTextEncoding(input, encoding) {
        if (encoding === "ASCII") {
          return validateStringIsAscii(input)
        }
        return validateStringIsHex(input)
      }

      function validateStringIsAscii(input) {
        let success = false;
        let error = "";
        let inputBytes = [];
        if (input.length == 0) {
          error = "You must provide a string value to encode, text box is empty.";
        } else if (!/^[ -~]+$/.test(input)) {
          error = `"${input}" contains data or characters that are not within the set of ASCII printable characters (0x20 - 0x7E)`;
        } else {
          success = true;
          inputBytes = stringToByteArray(inputText);
        }
        return { inputIsValid: success, errorMessage: error, inputBytes: inputBytes }
      }

      function validateStringIsHex(input) {
        let success = false;
        let error = "";
        let inputBytes = [];
        if (input.length == 0) {
          error = "You must provide a string value to encode, text box is empty.";
        } else if (!/^[0-9A-Fa-f]+$/.test(input)) {
          error = `"${input}" is not a valid hex string, must contain only hexadecimal digits (a-f, A-F, 0-9)`;
        } else if (input.length % 2 > 0) {
          error = `Hex string must have an even number of digits, length(${inputText}) = ${inputText.length}`;
        } else {
          success = true;
          inputBytes = hexStringToByteArray(inputText);
        }
        return { inputIsValid: success, errorMessage: error, inputBytes: inputBytes }
      }
    }

    function b64Encode({
      inputText,
      inputBytes,
      inputEncoding,
      base64Encoding,
      totalBytes,
      totalChunks,
      lastChunkPadded,
      lastChunkLength,
      padLength,
    }) {
      let encodedBase64 = "";
      let encodedChunks = [];
      for (let i = 0; i < totalChunks; i++) {
        let start = i * 3;
        let end = start + 3;
        let chunkIsPadded = false;
        if (lastChunkPadded && i === totalChunks - 1) {
          end = totalBytes;
          chunkIsPadded = true;
        }
        let chunkBytes = inputBytes.slice(start, end);
        let chunkHexString = byteArrayToHexString(chunkBytes);
        let chunkText = chunkHexString;
        if (inputEncoding === "ASCII") {
          chunkText = inputText.substring(start, end);
        }
        let chunkData = {
          chunkText: chunkText,
          chunkBytes: chunkBytes,
          chunkHexString: chunkHexString,
          chunkIsPadded: chunkIsPadded,
          chunkNumber: i,
          totalChunks: totalChunks,
          lastChunkPadded: lastChunkPadded,
          lastChunkLength: lastChunkLength,
          padLength: padLength,
        };
        let encodedChunk = encodeChunk(chunkData);
        encodedChunk.isASCII = inputEncoding === "ASCII";
        encodedChunks.push(encodedChunk);
        encodedBase64 += encodedChunk.chunkBase64;
      }
      return {
        inputText: inputText,
        chunks: processFinalResults(encodedChunks),
        inputEncoding: inputEncoding,
        outputEncoding: base64Encoding,
        isASCII: inputEncoding === "ASCII",
        outputText: encodedBase64,
      }

      // Local Functions
      function encodeChunk({
        chunkText,
        chunkBytes,
        chunkHexString,
        chunkIsPadded,
        padLength,
      }) {
        let inputHexMap = [];
        let chunkAsciiString = byteArrayToString(chunkBytes);
        let chunkBinStringArray = byteArrayTo8BitStringArray(chunkBytes);
        let chunkBinaryString = chunkBinStringArray.map(s => s).join("");
        for (let i = 0; i < chunkBinStringArray.length; i++) {
          const byteString = chunkBinStringArray[i];
          const word1 = byteString.substring(0, 4);
          const word2 = byteString.substring(4, 8);
          const byteMap = {
            bin_word1: word1,
            bin_word2: word2,
            hex_word1: BIN_TO_HEX[word1],
            hex_word2: BIN_TO_HEX[word2],
            ascii: chunkAsciiString[i],
            isWhiteSpace: false,
          };
          if (/^\s+$/.test(byteMap.ascii)) {
            byteMap.isWhiteSpace = true;
            byteMap.ascii = "ws";
          }
          inputHexMap.push(byteMap);
        }
        if (chunkIsPadded) {
          chunkBinaryString += "0".repeat(padLength);
        }
        const base64Alphabet = getBase64Alphabet(base64Encoding);
        const chunkLength = chunkBinaryString.length / 6;
        let chunkBase64 = "";
        let encodedBase64Map = [];
        for (let i = 0; i < chunkLength; i++) {
          let start = i * 6;
          let end = start + 6;
          const base64Digit6bit = chunkBinaryString.substring(start, end);
          const word1 = `00${base64Digit6bit.substring(0, 2)}`;
          const word2 = base64Digit6bit.substring(2, 6);
          const base64DigitHex = `${BIN_TO_HEX[word1]}${BIN_TO_HEX[word2]}`;
          const base64DigitDecimal = parseInt(base64DigitHex, 16);
          const base64Digit = base64Alphabet[base64DigitDecimal];
          chunkBase64 += base64Digit;
          const base64ByteMap = {
            bin: base64Digit6bit,
            dec: base64DigitDecimal,
            b64: base64Digit,
            isPad: false,
          };
          encodedBase64Map.push(base64ByteMap);
        }
        if (chunkIsPadded) {
          const encodedPadLength = 4 - chunkLength;
          chunkBase64 += "=".repeat(encodedPadLength);
          for (let i = 0; i < encodedPadLength; i++) {
            const encodedPadByteMap = {
              bin: "",
              dec: "",
              b64: "=",
              isPad: true,
            };
            encodedBase64Map.push(encodedPadByteMap);
          }
        }
        const encodedChunk = {
          chunkBase64: chunkBase64,
          chunkBytes: chunkBytes,
          chunkText: chunkText,
          chunkHexString: chunkHexString,
          hexMap: inputHexMap,
          base64Map: encodedBase64Map,
        };
        return encodedChunk
      }
    }

    function validateDecodeFormData(encodedText, base64Encoding) {
      // Preserve the original text value provided by the user
      const originalInputText = encodedText;

      // Remove padding characters
      encodedText = encodedText.replace(/[=]/g, "");
      let [base64Alphabet, base64AlphabetMap] = getBase64AlphabetMap(base64Encoding);
      let { inputIsValid, errorMessage } = validateBase64Encoding(
        originalInputText,
        encodedText,
        base64Alphabet,
        base64Encoding
      );
      if (!inputIsValid) {
        return [{ inputIsValid: false, errorMessage: errorMessage }, {}]
      }
      let totalChunks = (encodedText.length / 4) | 0;
      let lastChunkLength = encodedText.length % 4;
      if (lastChunkLength === 1) {
        errorMessage = `"${originalInputText}" is not a valid ${base64Encoding} string.`;
        return [{ inputIsValid: false, errorMessage: errorMessage }, {}]
      }
      let lastChunkPadded = false;
      if (lastChunkLength > 0) {
        totalChunks += 1;
        lastChunkPadded = true;
      }
      const inputData = {
        encodedText: encodedText,
        originalInputText: originalInputText,
        inputLength: encodedText.length,
        base64Encoding: base64Encoding,
        base64Alphabet: base64Alphabet,
        base64AlphabetMap: base64AlphabetMap,
        totalChunks: totalChunks,
        lastChunkPadded: lastChunkPadded,
        lastChunkLength: lastChunkLength,
      };
      return [{ inputIsValid: true }, inputData]

      function getBase64AlphabetMap(base64Encoding) {
        let base64Alphabet = getBase64Alphabet(base64Encoding);
        let base64AlphabetMap = {};
        base64Alphabet.split("").forEach((letter, index) => {
          base64AlphabetMap[letter] = index;
        });
        return [base64Alphabet, base64AlphabetMap]
      }

      function validateBase64Encoding(
        inputText,
        encodedText,
        base64Alphabet,
        base64Encoding
      ) {
        let onlyValidCharacters = false;
        let validFormat = false;
        if (inputText.length == 0) {
          const errorMessage = "You must provide a string value to decode, text box is empty.";
          return { inputIsValid: false, errorMessage: errorMessage }
        }
        if (base64Encoding === "base64") {
          onlyValidCharacters = /^[0-9A-Za-z+/=]+$/.test(inputText);
          validFormat = /^[0-9A-Za-z+/]+[=]{0,2}$/.test(inputText);
        } else if (base64Encoding === "base64url") {
          onlyValidCharacters = /^[0-9A-Za-z-_=]+$/.test(inputText);
          validFormat = /^[0-9A-Za-z-_]+[=]{0,2}$/.test(inputText);
        }
        if (!onlyValidCharacters) {
          let invalid = encodedText.split("").filter(char => !base64Alphabet.includes(char));
          let distinct = [...new Set(invalid)];
          let invalid_str = [];
          distinct.forEach(char => invalid_str.push(`["${char}", 0x${char.charCodeAt(0)}]`));
          invalid_str = invalid_str.join("\n");
          let pluralMaybe = distinct.length > 1 ? "characters" : "character";
          const errorMessage = `"${inputText}" contains ${distinct.length} invalid ${pluralMaybe}:\n${invalid_str}.`;
          return { inputIsValid: false, errorMessage: errorMessage }
        }
        if (!validFormat) {
          const errorMessage = `"${inputText}" is not a valid ${base64Encoding} string.`;
          return { inputIsValid: false, errorMessage: errorMessage }
        }
        return { inputIsValid: true, errorMessage: "" }
      }
    }

    function getBase64Alphabet(base64Encoding) {
      let b64Alphabet = B64_ALPHABET_COMMON;
      return base64Encoding === "base64" ? (b64Alphabet += "+/") : (b64Alphabet += "-_")
    }

    function b64Decode({
      encodedText,
      originalInputText,
      inputLength,
      base64Encoding,
      base64AlphabetMap,
      totalChunks,
      lastChunkPadded,
      lastChunkLength,
    }) {
      let binaryString = "";
      let decodedChunks = [];
      for (let i = 0; i < totalChunks; i++) {
        let start = i * 4;
        let end = start + 4;
        let chunkIsPadded = false;
        if (lastChunkPadded && i == totalChunks - 1) {
          end = inputLength;
          chunkIsPadded = true;
        }
        let chunkBase64 = encodedText.substring(start, end);
        let chunkData = {
          chunkBase64: chunkBase64,
          chunkIsPadded: chunkIsPadded,
          base64AlphabetMap: base64AlphabetMap,
          chunkNumber: i,
          totalChunks: totalChunks,
          lastChunkPadded: lastChunkPadded,
          lastChunkLength: lastChunkLength,
        };
        let decodedChunk = decodeChunk(chunkData);
        decodedChunks.push(decodedChunk);
        binaryString += decodedChunk.chunkBinaryString;
      }
      let totalBytes = (binaryString.length / 8) | 0;
      return decodeBytes(
        originalInputText,
        base64Encoding,
        binaryString,
        totalBytes,
        decodedChunks
      )

      // Local Functions
      function decodeChunk({
        chunkBase64,
        chunkIsPadded,
        base64AlphabetMap,
        lastChunkLength,
      }) {
        let chunkBinaryString = "";
        let decodedBase64Map = [];
        let chunkBase64Digits = chunkBase64.split("");
        for (let i = 0; i < chunkBase64Digits.length; i++) {
          let base64Digit = chunkBase64Digits[i];
          let base64DigitDecimal = base64AlphabetMap[base64Digit];
          let base64DigitBinary = base64DigitDecimal.toString(2);
          const padLength = 6 - base64DigitBinary.length;
          base64DigitBinary = `${"0".repeat(padLength)}${base64DigitBinary}`;
          chunkBinaryString += base64DigitBinary;
          let base64ByteMap = {
            bin: base64DigitBinary,
            dec: base64DigitDecimal,
            b64: base64Digit,
            isPad: false,
          };
          decodedBase64Map.push(base64ByteMap);
        }
        if (chunkIsPadded) {
          const padLength = 4 - lastChunkLength;
          chunkBase64 += "=".repeat(padLength);
          //chunkBinaryString += "000000"
          for (let i = 0; i < padLength; i++) {
            const byteMap = {
              bin: "",
              dec: "",
              b64: "=",
              isPad: true,
            };
            decodedBase64Map.push(byteMap);
          }
        }
        const decodedChunk = {
          chunkBase64: chunkBase64,
          chunkBinaryString: chunkBinaryString,
          base64Map: decodedBase64Map,
        };
        return decodedChunk
      }

      function decodeBytes(
        originalInputText,
        base64Encoding,
        binaryString,
        totalBytes,
        decodedChunks
      ) {
        let decodedHexString = "";
        let hexMap = [];
        for (let i = 0; i < totalBytes; i++) {
          let start = i * 8;
          let end = start + 8;
          let byteString = binaryString.substring(start, end);
          let word1 = byteString.substring(0, 4);
          let word2 = byteString.substring(4, 8);
          let hexWord1 = BIN_TO_HEX[word1];
          let hexWord2 = BIN_TO_HEX[word2];
          let hexByteString = `${hexWord1}${hexWord2}`;
          decodedHexString += hexByteString;
          let hexByte = hexStringToByteArray(hexByteString);
          const byteMap = {
            bin_word1: word1,
            bin_word2: word2,
            hex_word1: hexWord1,
            hex_word2: hexWord2,
            ascii: byteArrayToString(hexByte),
          };
          if (/^\s+$/.test(byteMap.ascii)) {
            byteMap.isWhiteSpace = true;
            byteMap.ascii = "ws";
          }
          hexMap.push(byteMap);
        }
        const decodedBytes = hexStringToByteArray(decodedHexString);
        return mapHexBytesToBase64Chunks(
          originalInputText,
          base64Encoding,
          decodedHexString,
          hexMap,
          decodedBytes,
          decodedChunks
        )
      }

      function mapHexBytesToBase64Chunks(
        originalInputText,
        base64Encoding,
        decodedHexString,
        hexMap,
        decodedBytes,
        decodedChunks
      ) {
        let decodedString = "";
        let isASCII = validateAsciiEncoding(decodedBytes);
        if (isASCII) {
          decodedString = byteArrayToString(decodedBytes);
        }
        for (let i = 0; i < decodedChunks.length; i++) {
          let bytesInChunk = [];
          for (let j = 0; j < 3; j++) {
            let byteIndex = i * 3 + j;
            if (byteIndex === hexMap.length) {
              break
            }
            bytesInChunk.push(hexMap[byteIndex]);
          }
          decodedChunks[i].hexMap = bytesInChunk;
          decodedChunks[i].isASCII = isASCII;
        }
        const finalResults = {
          inputText: originalInputText,
          chunks: processFinalResults(decodedChunks),
          inputEncoding: base64Encoding,
          outputEncoding: isASCII ? "ASCII" : "Hex",
          isASCII: isASCII,
          outputText: isASCII ? decodedString : decodedHexString,
          totalBytesOutput: decodedBytes.length,
        };
        return finalResults
      }

      function validateAsciiEncoding(byteArray) {
        let ascii = [];
        for (var i = 32; i < 127; i++) {
          ascii.push(i);
        }
        let invalid = byteArray.filter(byte => !ascii.includes(byte));
        return invalid.length == 0
      }
    }

    function processFinalResults(chunks) {
      for (let i = 0; i < chunks.length; i++) {
        let base64Map = chunks[i].base64Map;
        let base64Digit1 = base64Map[0];
        let base64Digit2 = base64Map[1];
        let base64Digit3 = base64Map[2];
        let base64Digit4 = base64Map[3];
        let base64BinaryString = `${base64Digit1.bin}${base64Digit2.bin}${base64Digit3.bin}${base64Digit4.bin}`;
        let base64Bits1 = base64BinaryString.substring(0, 6);
        let base64Bits2a = base64BinaryString.substring(6, 8);
        let base64Bits2b = base64BinaryString.substring(8, 12);
        let base64Bits3a = base64BinaryString.substring(12, 16);
        let base64Bits3b = base64BinaryString.substring(16, 18);
        let base64Bits4 = base64BinaryString.substring(18, 24);
        let hexBits1a = base64Bits1;
        let hexBits1b = base64Bits2a;
        let hexBits2a = base64Bits2b;
        let hexBits2b = base64Bits3a;
        let hexBits3a = base64Bits3b;
        let hexBits3b = base64Bits4;

        base64Digit1.groupId = `base64-chunk-${i + 1}-digit-1`;
        base64Digit1.bitGroups = [{ groupId: `hex-chunk-${i + 1}-byte-1`, bits: hexBits1a }];
        base64Digit2.groupId = `base64-chunk-${i + 1}-digit-2`;
        base64Digit2.bitGroups = [
          { groupId: `hex-chunk-${i + 1}-byte-1`, bits: hexBits1b },
          { groupId: `hex-chunk-${i + 1}-byte-2`, bits: hexBits2a },
        ];
        base64Digit3.groupId = `base64-chunk-${i + 1}-digit-3`;
        base64Digit3.bitGroups = [
          { groupId: `hex-chunk-${i + 1}-byte-2`, bits: hexBits2b },
          { groupId: `hex-chunk-${i + 1}-byte-3`, bits: hexBits3a },
        ];
        base64Digit4.groupId = `base64-chunk-${i + 1}-digit-4`;
        base64Digit4.bitGroups = [{ groupId: `hex-chunk-${i + 1}-byte-3`, bits: hexBits3b }];

        let hexMap = chunks[i].hexMap;
        let hexByte1 = hexMap[0];
        hexByte1.groupId = `hex-chunk-${i + 1}-byte-1`;
        hexByte1.bitGroups = [
          { groupId: `base64-chunk-${i + 1}-digit-1`, bits: base64Bits1 },
          { groupId: `base64-chunk-${i + 1}-digit-2`, bits: base64Bits2a },
        ];
        if (hexMap.length == 1) {
          base64Digit2.bitGroups = [
            { groupId: `hex-chunk-${i + 1}-byte-1`, bits: hexBits1b },
            { groupId: "pad", bits: hexBits2a },
          ];
          base64Digit3.bitGroups = [
            { groupId: "pad", bits: hexBits2b },
            { groupId: "pad", bits: hexBits3a },
          ];
          base64Digit4.bitGroups = [{ groupId: "pad", bits: hexBits3b }];
          continue
        }
        let hexByte2 = hexMap[1];
        hexByte2.groupId = `hex-chunk-${i + 1}-byte-2`;
        hexByte2.bitGroups = [
          { groupId: `base64-chunk-${i + 1}-digit-2`, bits: base64Bits2b },
          { groupId: `base64-chunk-${i + 1}-digit-3`, bits: base64Bits3a },
        ];
        if (hexMap.length == 2) {
          base64Digit3.bitGroups = [
            { groupId: `hex-chunk-${i + 1}-byte-2`, bits: hexBits2b },
            { groupId: "pad", bits: hexBits3a },
          ];
          base64Digit4.bitGroups = [{ groupId: "pad", bits: hexBits3b }];
          continue
        }
        let hexByte3 = hexMap[2];
        hexByte3.groupId = `hex-chunk-${i + 1}-byte-3`;
        hexByte3.bitGroups = [
          { groupId: `base64-chunk-${i + 1}-digit-3`, bits: base64Bits3b },
          { groupId: `base64-chunk-${i + 1}-digit-4`, bits: base64Bits4 },
        ];
      }
      return chunks
    }

    function stringToByteArray(s) {
      let result = [];
      for (let i = 0; i < s.length; i++) {
        result[i] = s.charCodeAt(i);
      }
      return result
    }

    function byteArrayToString(byteArray) {
      let result = "";
      for (let i = 0; i < byteArray.length; i++) {
        result += String.fromCharCode(byteArray[i]);
      }
      return result
    }

    function byteArrayToHexString(byteArray) {
      let hexString = "";
      let nextHexByte;
      for (let i = 0; i < byteArray.length; i++) {
        nextHexByte = byteArray[i].toString(16); // Integer to base 16
        if (nextHexByte.length < 2) {
          nextHexByte = "0" + nextHexByte; // Otherwise 10 becomes just a instead of 0a
        }
        hexString += nextHexByte;
      }
      return hexString
    }

    function hexStringToByteArray(hexString) {
      if (hexString.length % 2 !== 0) {
        throw "Must have an even number of hex digits to convert to bytes"
      }
      let numBytes = hexString.length / 2;
      let byteArray = new Uint8Array(numBytes);
      for (let i = 0; i < numBytes; i++) {
        byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
      }
      return byteArray
    }

    function byteArrayTo8BitStringArray(byteArray) {
      let binary = [];
      for (var i = 0; i < byteArray.length; i++) {
        let byteString = `${byteArray[i].toString(2)}`;
        const padLength = 8 - byteString.length;
        binary.push(`${"0".repeat(padLength)}${byteString}`);
      }
      return binary
    }

    /* src/components/RadioButtons.svelte generated by Svelte v3.17.3 */
    const file$6 = "src/components/RadioButtons.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (119:6) {#each buttons as button, i}
    function create_each_block(ctx) {
    	let div;
    	let input;
    	let input_id_value;
    	let input_value_value;
    	let input_checked_value;
    	let i = /*i*/ ctx[13];
    	let t0;
    	let label;
    	let t1_value = /*button*/ ctx[11].label + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let dispose;
    	const assign_input = () => /*input_binding*/ ctx[10](input, i);
    	const unassign_input = () => /*input_binding*/ ctx[10](null, i);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "id", input_id_value = /*button*/ ctx[11].id);
    			attr_dev(input, "name", /*groupName*/ ctx[3]);
    			input.value = input_value_value = /*button*/ ctx[11].value;
    			input.checked = input_checked_value = /*button*/ ctx[11].checked;
    			attr_dev(input, "class", "svelte-1arkybt");
    			add_location(input, file$6, 120, 10, 2826);
    			attr_dev(label, "for", label_for_value = /*button*/ ctx[11].id);
    			attr_dev(label, "class", "svelte-1arkybt");
    			add_location(label, file$6, 128, 10, 3080);
    			attr_dev(div, "class", "button-wrapper");
    			add_location(div, file$6, 119, 8, 2787);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			assign_input();
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, t1);
    			append_dev(div, t2);
    			dispose = listen_dev(input, "change", /*raiseSelectionChanged*/ ctx[6], false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*buttons*/ 16 && input_id_value !== (input_id_value = /*button*/ ctx[11].id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*groupName*/ 8) {
    				attr_dev(input, "name", /*groupName*/ ctx[3]);
    			}

    			if (dirty & /*buttons*/ 16 && input_value_value !== (input_value_value = /*button*/ ctx[11].value)) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*buttons*/ 16 && input_checked_value !== (input_checked_value = /*button*/ ctx[11].checked)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (i !== /*i*/ ctx[13]) {
    				unassign_input();
    				i = /*i*/ ctx[13];
    				assign_input();
    			}

    			if (dirty & /*buttons*/ 16 && t1_value !== (t1_value = /*button*/ ctx[11].label + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*buttons*/ 16 && label_for_value !== (label_for_value = /*button*/ ctx[11].id)) {
    				attr_dev(label, "for", label_for_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			unassign_input();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(119:6) {#each buttons as button, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let fieldset;
    	let legend;
    	let t0;
    	let t1;
    	let div0;
    	let each_value = /*buttons*/ ctx[4];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			fieldset = element("fieldset");
    			legend = element("legend");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(legend, "class", "svelte-1arkybt");
    			add_location(legend, file$6, 116, 4, 2687);
    			attr_dev(div0, "class", "radio-buttons svelte-1arkybt");
    			add_location(div0, file$6, 117, 4, 2716);
    			attr_dev(fieldset, "name", /*groupName*/ ctx[3]);
    			attr_dev(fieldset, "form", /*form*/ ctx[1]);
    			attr_dev(fieldset, "class", "svelte-1arkybt");
    			add_location(fieldset, file$6, 115, 2, 2648);
    			attr_dev(div1, "id", /*groupId*/ ctx[2]);
    			attr_dev(div1, "class", "radio-group svelte-1arkybt");
    			add_location(div1, file$6, 114, 0, 2607);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, fieldset);
    			append_dev(fieldset, legend);
    			append_dev(legend, t0);
    			append_dev(fieldset, t1);
    			append_dev(fieldset, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (dirty & /*buttons, groupName, instances, raiseSelectionChanged*/ 120) {
    				each_value = /*buttons*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*groupName*/ 8) {
    				attr_dev(fieldset, "name", /*groupName*/ ctx[3]);
    			}

    			if (dirty & /*form*/ 2) {
    				attr_dev(fieldset, "form", /*form*/ ctx[1]);
    			}

    			if (dirty & /*groupId*/ 4) {
    				attr_dev(div1, "id", /*groupId*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { title = "" } = $$props;
    	let { form = "" } = $$props;
    	let { groupId = "" } = $$props;
    	let { groupName = "" } = $$props;
    	let { buttons = [] } = $$props;
    	let instances = [];
    	const dispatch = createEventDispatcher();

    	function reset() {
    		buttons.forEach(button => {
    			const buttonInstance = getButtonInstance(button.id);
    			buttonInstance.checked = button.checked;
    		});
    	}

    	function raiseSelectionChanged(event) {
    		dispatch("selectionChanged", {
    			groupId,
    			groupName,
    			selectionId: event.target.id,
    			value: event.target.value
    		});
    	}

    	function getButtonInstance(buttonId) {
    		let selectedButton;

    		instances.forEach(button => {
    			if (button.id == buttonId) {
    				selectedButton = button;
    			}
    		});

    		return selectedButton;
    	}

    	const writable_props = ["title", "form", "groupId", "groupName", "buttons"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RadioButtons> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value, i) {
    		if (instances[i] === $$value) return;

    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			instances[i] = $$value;
    			$$invalidate(5, instances);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("form" in $$props) $$invalidate(1, form = $$props.form);
    		if ("groupId" in $$props) $$invalidate(2, groupId = $$props.groupId);
    		if ("groupName" in $$props) $$invalidate(3, groupName = $$props.groupName);
    		if ("buttons" in $$props) $$invalidate(4, buttons = $$props.buttons);
    	};

    	$$self.$capture_state = () => {
    		return {
    			title,
    			form,
    			groupId,
    			groupName,
    			buttons,
    			instances
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("form" in $$props) $$invalidate(1, form = $$props.form);
    		if ("groupId" in $$props) $$invalidate(2, groupId = $$props.groupId);
    		if ("groupName" in $$props) $$invalidate(3, groupName = $$props.groupName);
    		if ("buttons" in $$props) $$invalidate(4, buttons = $$props.buttons);
    		if ("instances" in $$props) $$invalidate(5, instances = $$props.instances);
    	};

    	return [
    		title,
    		form,
    		groupId,
    		groupName,
    		buttons,
    		instances,
    		raiseSelectionChanged,
    		reset,
    		dispatch,
    		getButtonInstance,
    		input_binding
    	];
    }

    class RadioButtons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			title: 0,
    			form: 1,
    			groupId: 2,
    			groupName: 3,
    			buttons: 4,
    			reset: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RadioButtons",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get title() {
    		return this.$$.ctx[0];
    	}

    	set title(title) {
    		this.$set({ title });
    		flush();
    	}

    	get form() {
    		return this.$$.ctx[1];
    	}

    	set form(form) {
    		this.$set({ form });
    		flush();
    	}

    	get groupId() {
    		return this.$$.ctx[2];
    	}

    	set groupId(groupId) {
    		this.$set({ groupId });
    		flush();
    	}

    	get groupName() {
    		return this.$$.ctx[3];
    	}

    	set groupName(groupName) {
    		this.$set({ groupName });
    		flush();
    	}

    	get buttons() {
    		return this.$$.ctx[4];
    	}

    	set buttons(buttons) {
    		this.$set({ buttons });
    		flush();
    	}

    	get reset() {
    		return this.$$.ctx[7];
    	}

    	set reset(value) {
    		throw new Error("<RadioButtons>: Cannot set read-only property 'reset'");
    	}
    }

    /* src/components/EncodeForm.svelte generated by Svelte v3.17.3 */
    const file$7 = "src/components/EncodeForm.svelte";

    // (181:8) <Button type={buttonType} on:click={submitEncodeForm}>
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Encode");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(181:8) <Button type={buttonType} on:click={submitEncodeForm}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div4;
    	let div0;
    	let t0;
    	let t1;
    	let div3;
    	let div2;
    	let div1;
    	let input;
    	let t2;
    	let p;
    	let current;
    	let dispose;
    	const radiobuttons0_spread_levels = [/*inputEncodingButtons*/ ctx[10]];
    	let radiobuttons0_props = {};

    	for (let i = 0; i < radiobuttons0_spread_levels.length; i += 1) {
    		radiobuttons0_props = assign(radiobuttons0_props, radiobuttons0_spread_levels[i]);
    	}

    	const radiobuttons0 = new RadioButtons({
    			props: radiobuttons0_props,
    			$$inline: true
    		});

    	/*radiobuttons0_binding*/ ctx[23](radiobuttons0);
    	radiobuttons0.$on("selectionChanged", /*plainTextEncodingChanged*/ ctx[7]);
    	const radiobuttons1_spread_levels = [/*outputEncodingButtons*/ ctx[11]];
    	let radiobuttons1_props = {};

    	for (let i = 0; i < radiobuttons1_spread_levels.length; i += 1) {
    		radiobuttons1_props = assign(radiobuttons1_props, radiobuttons1_spread_levels[i]);
    	}

    	const radiobuttons1 = new RadioButtons({
    			props: radiobuttons1_props,
    			$$inline: true
    		});

    	/*radiobuttons1_binding*/ ctx[24](radiobuttons1);
    	radiobuttons1.$on("selectionChanged", /*outputEncodingChanged*/ ctx[8]);

    	const button = new Button({
    			props: {
    				type: /*buttonType*/ ctx[0],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*submitEncodeForm*/ ctx[9]);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			create_component(radiobuttons0.$$.fragment);
    			t0 = space();
    			create_component(radiobuttons1.$$.fragment);
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t2 = space();
    			p = element("p");
    			create_component(button.$$.fragment);
    			attr_dev(div0, "class", "form-options svelte-1uuidft");
    			add_location(div0, file$7, 158, 2, 3884);
    			attr_dev(input, "expanded", "true");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "input");
    			add_location(input, file$7, 171, 8, 4372);
    			attr_dev(p, "class", "control");
    			add_location(p, file$7, 179, 8, 4583);
    			attr_dev(div1, "class", "control is-expanded");
    			add_location(div1, file$7, 170, 6, 4330);
    			attr_dev(div2, "class", "field has-addons");
    			toggle_class(div2, "is-danger", !/*inputIsValid*/ ctx[2]);
    			add_location(div2, file$7, 169, 4, 4261);
    			attr_dev(div3, "class", "form-input input-text svelte-1uuidft");
    			add_location(div3, file$7, 168, 2, 4221);
    			attr_dev(div4, "id", "encode-form");
    			attr_dev(div4, "class", "form-wrapper svelte-1uuidft");
    			add_location(div4, file$7, 157, 0, 3838);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			mount_component(radiobuttons0, div0, null);
    			append_dev(div0, t0);
    			mount_component(radiobuttons1, div0, null);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			/*input_binding*/ ctx[25](input);
    			set_input_value(input, /*plainTextBinding*/ ctx[1]);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			mount_component(button, p, null);
    			current = true;

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[26]),
    				listen_dev(input, "input", /*handlePlainTextChanged*/ ctx[6], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			const radiobuttons0_changes = (dirty & /*inputEncodingButtons*/ 1024)
    			? get_spread_update(radiobuttons0_spread_levels, [get_spread_object(/*inputEncodingButtons*/ ctx[10])])
    			: {};

    			radiobuttons0.$set(radiobuttons0_changes);

    			const radiobuttons1_changes = (dirty & /*outputEncodingButtons*/ 2048)
    			? get_spread_update(radiobuttons1_spread_levels, [get_spread_object(/*outputEncodingButtons*/ ctx[11])])
    			: {};

    			radiobuttons1.$set(radiobuttons1_changes);

    			if (dirty & /*plainTextBinding*/ 2 && input.value !== /*plainTextBinding*/ ctx[1]) {
    				set_input_value(input, /*plainTextBinding*/ ctx[1]);
    			}

    			const button_changes = {};
    			if (dirty & /*buttonType*/ 1) button_changes.type = /*buttonType*/ ctx[0];

    			if (dirty & /*$$scope*/ 134217728) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty & /*inputIsValid*/ 4) {
    				toggle_class(div2, "is-danger", !/*inputIsValid*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(radiobuttons0.$$.fragment, local);
    			transition_in(radiobuttons1.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(radiobuttons0.$$.fragment, local);
    			transition_out(radiobuttons1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			/*radiobuttons0_binding*/ ctx[23](null);
    			destroy_component(radiobuttons0);
    			/*radiobuttons1_binding*/ ctx[24](null);
    			destroy_component(radiobuttons1);
    			/*input_binding*/ ctx[25](null);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let plainTextEncoding = "ASCII";
    	let outputBase64Encoding = "base64url";
    	let errorMessage = "";
    	let inputData = {};
    	let inputType = "";
    	let buttonType = "blue";
    	let plainTextBinding = "";
    	let plainText = "";
    	let inputIsValid = true;
    	let textBox;
    	let plainTextEncodingButtons;
    	let outputBase64EncodingButtons;
    	const focus = () => textBox.focus();

    	const reset = () => {
    		$$invalidate(1, plainTextBinding = "");
    		plainTextEncodingButtons.reset();
    		outputBase64EncodingButtons.reset();
    		plainTextChanged("", true);
    	};

    	function handlePlainTextChanged(event) {
    		plainTextChanged(event.target.value);

    		if (event.keyCode == 13) {
    			submitEncodeForm();
    		}
    	}

    	function plainTextChanged(newValue, formReset = false) {
    		if (formReset || plainText != newValue) {
    			plainText = newValue;
    			$$invalidate(2, inputIsValid = true);
    			toggleInputStyle();
    			dispatch("plainTextChanged", { value: plainText });
    		}
    	}

    	function plainTextEncodingChanged(event) {
    		plainTextEncoding = event.detail.value;
    		$$invalidate(2, inputIsValid = true);
    		toggleInputStyle();
    		dispatch("plainTextEncodingChanged", { value: plainTextEncoding });
    	}

    	function outputEncodingChanged(event) {
    		outputBase64Encoding = event.detail.value;
    		$$invalidate(2, inputIsValid = true);
    		toggleInputStyle();
    		dispatch("outputEncodingChanged", { value: outputBase64Encoding });
    	}

    	function submitEncodeForm() {
    		$$invalidate(2, [{ inputIsValid, errorMessage }, inputData] = validateEncodeFormData(plainText, plainTextEncoding, outputBase64Encoding), inputIsValid);

    		if (inputIsValid) {
    			let { outputText, chunks } = b64Encode(inputData);
    			dispatch("encodingSucceeded", { outputText, chunks });
    		} else {
    			dispatch("errorOccurred", { error: errorMessage });
    		}

    		toggleInputStyle();
    	}

    	function toggleInputStyle() {
    		inputType = inputIsValid ? "" : "is-danger";
    		$$invalidate(0, buttonType = inputIsValid ? "blue" : "is-danger");
    	}

    	const inputEncodingButtons = {
    		title: "Input Encoding",
    		form: "encode-form",
    		groupId: "input-encoding",
    		groupName: "inputEncoding",
    		buttons: [
    			{
    				label: "ASCII",
    				id: "inputEncoding1",
    				value: "ASCII",
    				checked: true
    			},
    			{
    				label: "Hex",
    				id: "inputEncoding2",
    				value: "Hex",
    				checked: false
    			}
    		]
    	};

    	const outputEncodingButtons = {
    		title: "Output Encoding",
    		form: "encode-form",
    		groupId: "output-base64-encoding",
    		groupName: "base64EncodingOut",
    		buttons: [
    			{
    				label: "base64",
    				id: "base64EncodingOut1",
    				value: "base64",
    				checked: false
    			},
    			{
    				label: "base64url",
    				id: "base64EncodingOut2",
    				value: "base64url",
    				checked: true
    			}
    		]
    	};

    	function radiobuttons0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, plainTextEncodingButtons = $$value);
    		});
    	}

    	function radiobuttons1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(5, outputBase64EncodingButtons = $$value);
    		});
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, textBox = $$value);
    		});
    	}

    	function input_input_handler() {
    		plainTextBinding = this.value;
    		$$invalidate(1, plainTextBinding);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("plainTextEncoding" in $$props) plainTextEncoding = $$props.plainTextEncoding;
    		if ("outputBase64Encoding" in $$props) outputBase64Encoding = $$props.outputBase64Encoding;
    		if ("errorMessage" in $$props) errorMessage = $$props.errorMessage;
    		if ("inputData" in $$props) inputData = $$props.inputData;
    		if ("inputType" in $$props) inputType = $$props.inputType;
    		if ("buttonType" in $$props) $$invalidate(0, buttonType = $$props.buttonType);
    		if ("plainTextBinding" in $$props) $$invalidate(1, plainTextBinding = $$props.plainTextBinding);
    		if ("plainText" in $$props) plainText = $$props.plainText;
    		if ("inputIsValid" in $$props) $$invalidate(2, inputIsValid = $$props.inputIsValid);
    		if ("textBox" in $$props) $$invalidate(3, textBox = $$props.textBox);
    		if ("plainTextEncodingButtons" in $$props) $$invalidate(4, plainTextEncodingButtons = $$props.plainTextEncodingButtons);
    		if ("outputBase64EncodingButtons" in $$props) $$invalidate(5, outputBase64EncodingButtons = $$props.outputBase64EncodingButtons);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*plainTextBinding*/ 2) {
    			 plainTextChanged(plainTextBinding);
    		}
    	};

    	return [
    		buttonType,
    		plainTextBinding,
    		inputIsValid,
    		textBox,
    		plainTextEncodingButtons,
    		outputBase64EncodingButtons,
    		handlePlainTextChanged,
    		plainTextEncodingChanged,
    		outputEncodingChanged,
    		submitEncodeForm,
    		inputEncodingButtons,
    		outputEncodingButtons,
    		focus,
    		reset,
    		plainTextEncoding,
    		outputBase64Encoding,
    		errorMessage,
    		inputData,
    		inputType,
    		plainText,
    		dispatch,
    		plainTextChanged,
    		toggleInputStyle,
    		radiobuttons0_binding,
    		radiobuttons1_binding,
    		input_binding,
    		input_input_handler
    	];
    }

    class EncodeForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { focus: 12, reset: 13 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EncodeForm",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get focus() {
    		return this.$$.ctx[12];
    	}

    	set focus(value) {
    		throw new Error("<EncodeForm>: Cannot set read-only property 'focus'");
    	}

    	get reset() {
    		return this.$$.ctx[13];
    	}

    	set reset(value) {
    		throw new Error("<EncodeForm>: Cannot set read-only property 'reset'");
    	}
    }

    /* src/components/DecodeForm.svelte generated by Svelte v3.17.3 */
    const file$8 = "src/components/DecodeForm.svelte";

    // (154:8) <Button type={buttonType} on:click={submitDecodeForm}>
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Decode");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(154:8) <Button type={buttonType} on:click={submitDecodeForm}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div4;
    	let div0;
    	let t0;
    	let div3;
    	let div2;
    	let div1;
    	let input;
    	let t1;
    	let p;
    	let current;
    	let dispose;
    	const radiobuttons_spread_levels = [/*inputDecodingButtons*/ ctx[8]];
    	let radiobuttons_props = {};

    	for (let i = 0; i < radiobuttons_spread_levels.length; i += 1) {
    		radiobuttons_props = assign(radiobuttons_props, radiobuttons_spread_levels[i]);
    	}

    	const radiobuttons = new RadioButtons({
    			props: radiobuttons_props,
    			$$inline: true
    		});

    	/*radiobuttons_binding*/ ctx[19](radiobuttons);
    	radiobuttons.$on("selectionChanged", /*inputEncodingChanged*/ ctx[6]);

    	const button = new Button({
    			props: {
    				type: /*buttonType*/ ctx[0],
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*submitDecodeForm*/ ctx[7]);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			create_component(radiobuttons.$$.fragment);
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t1 = space();
    			p = element("p");
    			create_component(button.$$.fragment);
    			attr_dev(div0, "class", "form-options svelte-ruvvar");
    			add_location(div0, file$8, 135, 2, 3349);
    			attr_dev(input, "expanded", "true");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "input");
    			add_location(input, file$8, 144, 8, 3687);
    			attr_dev(p, "class", "control");
    			add_location(p, file$8, 152, 8, 3902);
    			attr_dev(div1, "class", "control is-expanded");
    			add_location(div1, file$8, 143, 6, 3645);
    			attr_dev(div2, "class", "field has-addons");
    			toggle_class(div2, "is-danger", !/*inputIsValid*/ ctx[2]);
    			add_location(div2, file$8, 142, 4, 3576);
    			attr_dev(div3, "class", "form-input encoded-text svelte-ruvvar");
    			add_location(div3, file$8, 141, 2, 3534);
    			attr_dev(div4, "id", "decode-form");
    			attr_dev(div4, "class", "form-wrapper svelte-ruvvar");
    			add_location(div4, file$8, 134, 0, 3303);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			mount_component(radiobuttons, div0, null);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			/*input_binding*/ ctx[20](input);
    			set_input_value(input, /*encodedTextBinding*/ ctx[1]);
    			append_dev(div1, t1);
    			append_dev(div1, p);
    			mount_component(button, p, null);
    			current = true;

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[21]),
    				listen_dev(input, "input", /*handleEncodedTextChanged*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			const radiobuttons_changes = (dirty & /*inputDecodingButtons*/ 256)
    			? get_spread_update(radiobuttons_spread_levels, [get_spread_object(/*inputDecodingButtons*/ ctx[8])])
    			: {};

    			radiobuttons.$set(radiobuttons_changes);

    			if (dirty & /*encodedTextBinding*/ 2 && input.value !== /*encodedTextBinding*/ ctx[1]) {
    				set_input_value(input, /*encodedTextBinding*/ ctx[1]);
    			}

    			const button_changes = {};
    			if (dirty & /*buttonType*/ 1) button_changes.type = /*buttonType*/ ctx[0];

    			if (dirty & /*$$scope*/ 4194304) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty & /*inputIsValid*/ 4) {
    				toggle_class(div2, "is-danger", !/*inputIsValid*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(radiobuttons.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(radiobuttons.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			/*radiobuttons_binding*/ ctx[19](null);
    			destroy_component(radiobuttons);
    			/*input_binding*/ ctx[20](null);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let inputBase64Encoding = "base64url";
    	let errorMessage = "";
    	let inputData = {};
    	let inputType = "";
    	let buttonType = "green";
    	let encodedTextBinding = "";
    	let encodedText = "";
    	let inputIsValid = true;
    	let textBox;
    	let inputBase64EncodingButtons;
    	const focus = () => textBox.focus();

    	const reset = () => {
    		$$invalidate(1, encodedTextBinding = "");
    		inputBase64EncodingButtons.reset();
    		encodedTextChanged("", true);
    	};

    	function handleEncodedTextChanged(event) {
    		encodedTextChanged(event.target.value);

    		if (event.keyCode == 13) {
    			submitDecodeForm();
    		}
    	}

    	function encodedTextChanged(newValue, formReset = false) {
    		if (formReset || encodedText != event.target.value) {
    			encodedText = newValue;
    			$$invalidate(2, inputIsValid = true);
    			toggleInputStyle();
    			dispatch("encodedTextChanged", { value: encodedText });
    		}
    	}

    	function inputEncodingChanged(event) {
    		inputBase64Encoding = event.detail.value;
    		$$invalidate(2, inputIsValid = true);
    		toggleInputStyle();
    		dispatch("inputEncodingChanged", { value: inputBase64Encoding });
    	}

    	function submitDecodeForm() {
    		$$invalidate(2, [{ inputIsValid, errorMessage }, inputData] = validateDecodeFormData(encodedText, inputBase64Encoding), inputIsValid);

    		if (inputIsValid) {
    			let { chunks, outputText, totalBytesOutput, isASCII } = b64Decode(inputData);

    			dispatch("decodingSucceeded", {
    				outputText,
    				chunks,
    				totalBytesOutput,
    				isASCII
    			});
    		} else {
    			dispatch("errorOccurred", { error: errorMessage });
    		}

    		toggleInputStyle();
    	}

    	function toggleInputStyle() {
    		inputType = inputIsValid ? "" : "is-danger";
    		$$invalidate(0, buttonType = inputIsValid ? "green" : "is-danger");
    	}

    	const inputDecodingButtons = {
    		title: "Input Encoding",
    		form: "decode-form",
    		groupId: "input-base64-encoding",
    		groupName: "base64EncodingIn",
    		buttons: [
    			{
    				label: "base64",
    				id: "base64EncodingIn1",
    				value: "base64",
    				checked: false
    			},
    			{
    				label: "base64url",
    				id: "base64EncodingIn2",
    				value: "base64url",
    				checked: true
    			}
    		]
    	};

    	function radiobuttons_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, inputBase64EncodingButtons = $$value);
    		});
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, textBox = $$value);
    		});
    	}

    	function input_input_handler() {
    		encodedTextBinding = this.value;
    		$$invalidate(1, encodedTextBinding);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("inputBase64Encoding" in $$props) inputBase64Encoding = $$props.inputBase64Encoding;
    		if ("errorMessage" in $$props) errorMessage = $$props.errorMessage;
    		if ("inputData" in $$props) inputData = $$props.inputData;
    		if ("inputType" in $$props) inputType = $$props.inputType;
    		if ("buttonType" in $$props) $$invalidate(0, buttonType = $$props.buttonType);
    		if ("encodedTextBinding" in $$props) $$invalidate(1, encodedTextBinding = $$props.encodedTextBinding);
    		if ("encodedText" in $$props) encodedText = $$props.encodedText;
    		if ("inputIsValid" in $$props) $$invalidate(2, inputIsValid = $$props.inputIsValid);
    		if ("textBox" in $$props) $$invalidate(3, textBox = $$props.textBox);
    		if ("inputBase64EncodingButtons" in $$props) $$invalidate(4, inputBase64EncodingButtons = $$props.inputBase64EncodingButtons);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*encodedTextBinding*/ 2) {
    			 encodedTextChanged(encodedTextBinding);
    		}
    	};

    	return [
    		buttonType,
    		encodedTextBinding,
    		inputIsValid,
    		textBox,
    		inputBase64EncodingButtons,
    		handleEncodedTextChanged,
    		inputEncodingChanged,
    		submitDecodeForm,
    		inputDecodingButtons,
    		focus,
    		reset,
    		inputBase64Encoding,
    		errorMessage,
    		inputData,
    		inputType,
    		encodedText,
    		dispatch,
    		encodedTextChanged,
    		toggleInputStyle,
    		radiobuttons_binding,
    		input_binding,
    		input_input_handler
    	];
    }

    class DecodeForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { focus: 9, reset: 10 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DecodeForm",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get focus() {
    		return this.$$.ctx[9];
    	}

    	set focus(value) {
    		throw new Error("<DecodeForm>: Cannot set read-only property 'focus'");
    	}

    	get reset() {
    		return this.$$.ctx[10];
    	}

    	set reset(value) {
    		throw new Error("<DecodeForm>: Cannot set read-only property 'reset'");
    	}
    }

    /* src/components/FormResults.svelte generated by Svelte v3.17.3 */
    const file$9 = "src/components/FormResults.svelte";

    // (235:6) {#if showEncodeForm}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Total Bytes: ");
    			t1 = text(/*totalBytesIn*/ ctx[6]);
    			attr_dev(div, "class", "byte-length svelte-kuvida");
    			add_location(div, file$9, 235, 8, 5342);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*totalBytesIn*/ 64) set_data_dev(t1, /*totalBytesIn*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(235:6) {#if showEncodeForm}",
    		ctx
    	});

    	return block;
    }

    // (254:6) {#if !showEncodeForm}
    function create_if_block$4(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Total Bytes: ");
    			t1 = text(/*totalBytesOut*/ ctx[5]);
    			attr_dev(div, "class", "byte-length svelte-kuvida");
    			add_location(div, file$9, 254, 8, 5856);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*totalBytesOut*/ 32) set_data_dev(t1, /*totalBytesOut*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(254:6) {#if !showEncodeForm}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div4;
    	let fieldset0;
    	let legend0;
    	let t1;
    	let div1;
    	let div0;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let textarea0;
    	let t6;
    	let fieldset1;
    	let legend1;
    	let t8;
    	let div3;
    	let div2;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let textarea1;
    	let dispose;
    	let if_block0 = /*showEncodeForm*/ ctx[0] && create_if_block_1$2(ctx);
    	let if_block1 = !/*showEncodeForm*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			fieldset0 = element("fieldset");
    			legend0 = element("legend");
    			legend0.textContent = "Input";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t2 = text("Encoding: ");
    			t3 = text(/*inputEncoding*/ ctx[7]);
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			textarea0 = element("textarea");
    			t6 = space();
    			fieldset1 = element("fieldset");
    			legend1 = element("legend");
    			legend1.textContent = "Output";
    			t8 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t9 = text("Encoding: ");
    			t10 = text(/*outputEncoding*/ ctx[8]);
    			t11 = space();
    			if (if_block1) if_block1.c();
    			t12 = space();
    			textarea1 = element("textarea");
    			attr_dev(legend0, "class", "svelte-kuvida");
    			add_location(legend0, file$9, 231, 4, 5190);
    			attr_dev(div0, "class", "encoding svelte-kuvida");
    			add_location(div0, file$9, 233, 6, 5253);
    			attr_dev(div1, "class", "details-wrapper svelte-kuvida");
    			add_location(div1, file$9, 232, 4, 5217);
    			attr_dev(textarea0, "id", "copyable-input-text");
    			textarea0.readOnly = true;
    			attr_dev(textarea0, "autoresize", "");
    			attr_dev(textarea0, "rows", "1");
    			attr_dev(textarea0, "class", "svelte-kuvida");
    			add_location(textarea0, file$9, 238, 4, 5428);
    			attr_dev(fieldset0, "class", "results-in svelte-kuvida");
    			toggle_class(fieldset0, "blue", /*showEncodeForm*/ ctx[0]);
    			toggle_class(fieldset0, "green", !/*showEncodeForm*/ ctx[0]);
    			add_location(fieldset0, file$9, 227, 2, 5086);
    			attr_dev(legend1, "class", "svelte-kuvida");
    			add_location(legend1, file$9, 250, 4, 5701);
    			attr_dev(div2, "class", "encoding svelte-kuvida");
    			add_location(div2, file$9, 252, 6, 5765);
    			attr_dev(div3, "class", "details-wrapper svelte-kuvida");
    			add_location(div3, file$9, 251, 4, 5729);
    			attr_dev(textarea1, "id", "copyable-output-text");
    			textarea1.readOnly = true;
    			attr_dev(textarea1, "autoresize", "");
    			attr_dev(textarea1, "rows", "1");
    			attr_dev(textarea1, "class", "svelte-kuvida");
    			add_location(textarea1, file$9, 257, 4, 5943);
    			attr_dev(fieldset1, "class", "results-out svelte-kuvida");
    			toggle_class(fieldset1, "blue", !/*showEncodeForm*/ ctx[0]);
    			toggle_class(fieldset1, "green", /*showEncodeForm*/ ctx[0]);
    			add_location(fieldset1, file$9, 246, 2, 5596);
    			attr_dev(div4, "id", "results");
    			attr_dev(div4, "class", "results-wrapper svelte-kuvida");
    			add_location(div4, file$9, 226, 0, 5041);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, fieldset0);
    			append_dev(fieldset0, legend0);
    			append_dev(fieldset0, t1);
    			append_dev(fieldset0, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div1, t4);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(fieldset0, t5);
    			append_dev(fieldset0, textarea0);
    			set_input_value(textarea0, /*inputText*/ ctx[2]);
    			/*textarea0_binding*/ ctx[29](textarea0);
    			append_dev(div4, t6);
    			append_dev(div4, fieldset1);
    			append_dev(fieldset1, legend1);
    			append_dev(fieldset1, t8);
    			append_dev(fieldset1, div3);
    			append_dev(div3, div2);
    			append_dev(div2, t9);
    			append_dev(div2, t10);
    			append_dev(div3, t11);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(fieldset1, t12);
    			append_dev(fieldset1, textarea1);
    			set_input_value(textarea1, /*outputText*/ ctx[4]);
    			/*textarea1_binding*/ ctx[31](textarea1);

    			dispose = [
    				listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[28]),
    				listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[30])
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*inputEncoding*/ 128) set_data_dev(t3, /*inputEncoding*/ ctx[7]);

    			if (/*showEncodeForm*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(div1, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*inputText*/ 4) {
    				set_input_value(textarea0, /*inputText*/ ctx[2]);
    			}

    			if (dirty[0] & /*showEncodeForm*/ 1) {
    				toggle_class(fieldset0, "blue", /*showEncodeForm*/ ctx[0]);
    			}

    			if (dirty[0] & /*showEncodeForm*/ 1) {
    				toggle_class(fieldset0, "green", !/*showEncodeForm*/ ctx[0]);
    			}

    			if (dirty[0] & /*outputEncoding*/ 256) set_data_dev(t10, /*outputEncoding*/ ctx[8]);

    			if (!/*showEncodeForm*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*outputText*/ 16) {
    				set_input_value(textarea1, /*outputText*/ ctx[4]);
    			}

    			if (dirty[0] & /*showEncodeForm*/ 1) {
    				toggle_class(fieldset1, "blue", !/*showEncodeForm*/ ctx[0]);
    			}

    			if (dirty[0] & /*showEncodeForm*/ 1) {
    				toggle_class(fieldset1, "green", /*showEncodeForm*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			/*textarea0_binding*/ ctx[29](null);
    			if (if_block1) if_block1.d();
    			/*textarea1_binding*/ ctx[31](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getHexBytes(hexString) {
    	if (!hexString) return 0;

    	// Remove 0x from beginning of string since this is a valid hex format
    	if ((/^0x\w+$/).test(hexString)) {
    		hexString = hexString.replace(/0x/, "");
    	}

    	return hexString.length / 2;
    }

    async function copyText(textToCopy, copyableTextArea) {
    	const success = await copyTextWithNavigator(textToCopy);

    	if (!success) {
    		copyableTextArea.select();
    		document.execCommand("copy");
    	}
    }

    async function copyTextWithNavigator(textToCopy) {
    	try {
    		result = await navigator.permissions.query({ name: "clipboard-write" });

    		if (result.state != "granted" && result.state != "prompt") {
    			return false;
    		}

    		await navigator.clipboard.writeText(textToCopy);
    		return true;
    	} catch(e) {
    		return false;
    	}
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let showEncodeForm;
    	let inputTextArea;
    	let inputText;
    	let outputTextArea;
    	let outputText = "";
    	let plainTextEncoding;
    	let outputBase64Encoding;
    	let inputBase64Encoding;
    	let totalBytesOut = 0;
    	let outputIsAscii;

    	onMount(() => {
    		$$invalidate(0, showEncodeForm = true);
    		$$invalidate(2, inputText = "");
    		$$invalidate(20, plainTextEncoding = "ASCII");
    		$$invalidate(21, outputBase64Encoding = "base64url");
    		$$invalidate(22, inputBase64Encoding = "base64url");
    		$$invalidate(23, outputIsAscii = true);
    	});

    	function handleFormToggled(encodeFormToggled) {
    		reset();
    		$$invalidate(0, showEncodeForm = encodeFormToggled);
    	}

    	function reset() {
    		$$invalidate(2, inputText = "");
    		$$invalidate(20, plainTextEncoding = "ASCII");
    		$$invalidate(21, outputBase64Encoding = "base64url");
    		$$invalidate(22, inputBase64Encoding = "base64url");
    		$$invalidate(4, outputText = "");
    		$$invalidate(5, totalBytesOut = 0);
    		$$invalidate(23, outputIsAscii = true);
    	}

    	function handlePlainTextChanged(event) {
    		clearLastResult();

    		if (showEncodeForm) {
    			$$invalidate(2, inputText = event.detail.value);
    		}
    	}

    	function handleEncodedTextChanged(event) {
    		clearLastResult();

    		if (!showEncodeForm) {
    			$$invalidate(2, inputText = event.detail.value);
    		}
    	}

    	function handlePlainTextEncodingChanged(event) {
    		clearLastResult();

    		if (showEncodeForm) {
    			$$invalidate(20, plainTextEncoding = event.detail.value);
    		}
    	}

    	function handleOutputBase64EncodingChanged(event) {
    		clearLastResult();

    		if (showEncodeForm) {
    			$$invalidate(21, outputBase64Encoding = event.detail.value);
    		}
    	}

    	function handleInputBase64EncodingChanged(event) {
    		clearLastResult();

    		if (!showEncodeForm) {
    			$$invalidate(22, inputBase64Encoding = event.detail.value);
    		}
    	}

    	function handleOutputEncodedTextChanged(outputEncodedText) {
    		if (showEncodeForm) {
    			$$invalidate(4, outputText = outputEncodedText);
    		}
    	}

    	function handleOutputDecodedTextChanged(outputDecodedText) {
    		if (!showEncodeForm) {
    			$$invalidate(4, outputText = outputDecodedText);
    		}
    	}

    	const handleTotalBytesOutChanged = totalBytesDecodedOut => $$invalidate(5, totalBytesOut = totalBytesDecodedOut);

    	function handleOutputIsAsciiChanged(isASCII) {
    		if (!showEncodeForm) {
    			$$invalidate(23, outputIsAscii = isASCII);
    		}
    	}

    	function clearLastResult() {
    		$$invalidate(4, outputText = "");
    		$$invalidate(5, totalBytesOut = 0);
    	}

    	async function copyInputText() {
    		await copyText(inputText, inputTextArea);
    	}

    	async function copyOutputText() {
    		await copyText(outputText, outputTextArea);
    	}

    	function textarea0_input_handler() {
    		inputText = this.value;
    		$$invalidate(2, inputText);
    	}

    	function textarea0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, inputTextArea = $$value);
    		});
    	}

    	function textarea1_input_handler() {
    		outputText = this.value;
    		$$invalidate(4, outputText);
    	}

    	function textarea1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, outputTextArea = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("showEncodeForm" in $$props) $$invalidate(0, showEncodeForm = $$props.showEncodeForm);
    		if ("inputTextArea" in $$props) $$invalidate(1, inputTextArea = $$props.inputTextArea);
    		if ("inputText" in $$props) $$invalidate(2, inputText = $$props.inputText);
    		if ("outputTextArea" in $$props) $$invalidate(3, outputTextArea = $$props.outputTextArea);
    		if ("outputText" in $$props) $$invalidate(4, outputText = $$props.outputText);
    		if ("plainTextEncoding" in $$props) $$invalidate(20, plainTextEncoding = $$props.plainTextEncoding);
    		if ("outputBase64Encoding" in $$props) $$invalidate(21, outputBase64Encoding = $$props.outputBase64Encoding);
    		if ("inputBase64Encoding" in $$props) $$invalidate(22, inputBase64Encoding = $$props.inputBase64Encoding);
    		if ("totalBytesOut" in $$props) $$invalidate(5, totalBytesOut = $$props.totalBytesOut);
    		if ("outputIsAscii" in $$props) $$invalidate(23, outputIsAscii = $$props.outputIsAscii);
    		if ("totalBytesIn" in $$props) $$invalidate(6, totalBytesIn = $$props.totalBytesIn);
    		if ("isASCII" in $$props) isASCII = $$props.isASCII;
    		if ("inputEncoding" in $$props) $$invalidate(7, inputEncoding = $$props.inputEncoding);
    		if ("outputEncoding" in $$props) $$invalidate(8, outputEncoding = $$props.outputEncoding);
    	};

    	let totalBytesIn;
    	let isASCII;
    	let inputEncoding;
    	let outputEncoding;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*plainTextEncoding, inputText*/ 1048580) {
    			 $$invalidate(6, totalBytesIn = plainTextEncoding == "ASCII"
    			? inputText.length
    			: getHexBytes(inputText));
    		}

    		if ($$self.$$.dirty[0] & /*showEncodeForm, plainTextEncoding, outputIsAscii*/ 9437185) {
    			 isASCII = showEncodeForm
    			? plainTextEncoding == "ASCII"
    			: outputIsAscii;
    		}

    		if ($$self.$$.dirty[0] & /*showEncodeForm, plainTextEncoding, inputBase64Encoding*/ 5242881) {
    			 $$invalidate(7, inputEncoding = showEncodeForm ? plainTextEncoding : inputBase64Encoding);
    		}

    		if ($$self.$$.dirty[0] & /*showEncodeForm, outputBase64Encoding, outputIsAscii*/ 10485761) {
    			 $$invalidate(8, outputEncoding = showEncodeForm
    			? outputBase64Encoding
    			: outputIsAscii ? "ASCII" : "Hex");
    		}
    	};

    	return [
    		showEncodeForm,
    		inputTextArea,
    		inputText,
    		outputTextArea,
    		outputText,
    		totalBytesOut,
    		totalBytesIn,
    		inputEncoding,
    		outputEncoding,
    		handleFormToggled,
    		reset,
    		handlePlainTextChanged,
    		handleEncodedTextChanged,
    		handlePlainTextEncodingChanged,
    		handleOutputBase64EncodingChanged,
    		handleInputBase64EncodingChanged,
    		handleOutputEncodedTextChanged,
    		handleOutputDecodedTextChanged,
    		handleTotalBytesOutChanged,
    		handleOutputIsAsciiChanged,
    		plainTextEncoding,
    		outputBase64Encoding,
    		inputBase64Encoding,
    		outputIsAscii,
    		isASCII,
    		clearLastResult,
    		copyInputText,
    		copyOutputText,
    		textarea0_input_handler,
    		textarea0_binding,
    		textarea1_input_handler,
    		textarea1_binding
    	];
    }

    class FormResults extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$a,
    			create_fragment$a,
    			safe_not_equal,
    			{
    				handleFormToggled: 9,
    				reset: 10,
    				handlePlainTextChanged: 11,
    				handleEncodedTextChanged: 12,
    				handlePlainTextEncodingChanged: 13,
    				handleOutputBase64EncodingChanged: 14,
    				handleInputBase64EncodingChanged: 15,
    				handleOutputEncodedTextChanged: 16,
    				handleOutputDecodedTextChanged: 17,
    				handleTotalBytesOutChanged: 18,
    				handleOutputIsAsciiChanged: 19
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormResults",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get handleFormToggled() {
    		return this.$$.ctx[9];
    	}

    	set handleFormToggled(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handleFormToggled'");
    	}

    	get reset() {
    		return this.$$.ctx[10];
    	}

    	set reset(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'reset'");
    	}

    	get handlePlainTextChanged() {
    		return this.$$.ctx[11];
    	}

    	set handlePlainTextChanged(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handlePlainTextChanged'");
    	}

    	get handleEncodedTextChanged() {
    		return this.$$.ctx[12];
    	}

    	set handleEncodedTextChanged(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handleEncodedTextChanged'");
    	}

    	get handlePlainTextEncodingChanged() {
    		return this.$$.ctx[13];
    	}

    	set handlePlainTextEncodingChanged(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handlePlainTextEncodingChanged'");
    	}

    	get handleOutputBase64EncodingChanged() {
    		return this.$$.ctx[14];
    	}

    	set handleOutputBase64EncodingChanged(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handleOutputBase64EncodingChanged'");
    	}

    	get handleInputBase64EncodingChanged() {
    		return this.$$.ctx[15];
    	}

    	set handleInputBase64EncodingChanged(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handleInputBase64EncodingChanged'");
    	}

    	get handleOutputEncodedTextChanged() {
    		return this.$$.ctx[16];
    	}

    	set handleOutputEncodedTextChanged(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handleOutputEncodedTextChanged'");
    	}

    	get handleOutputDecodedTextChanged() {
    		return this.$$.ctx[17];
    	}

    	set handleOutputDecodedTextChanged(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handleOutputDecodedTextChanged'");
    	}

    	get handleTotalBytesOutChanged() {
    		return this.$$.ctx[18];
    	}

    	set handleTotalBytesOutChanged(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handleTotalBytesOutChanged'");
    	}

    	get handleOutputIsAsciiChanged() {
    		return this.$$.ctx[19];
    	}

    	set handleOutputIsAsciiChanged(value) {
    		throw new Error("<FormResults>: Cannot set read-only property 'handleOutputIsAsciiChanged'");
    	}
    }

    /* src/components/EncodedChunk.svelte generated by Svelte v3.17.3 */

    const file$a = "src/components/EncodedChunk.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (207:14) {#each hexByte.bitGroups as bitGroup}
    function create_each_block_3(ctx) {
    	let span;
    	let t0_value = /*bitGroup*/ ctx[4].bits + "";
    	let t0;
    	let t1;
    	let span_data_bit_group_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "bit-group svelte-10pp6cf");
    			attr_dev(span, "data-bit-group", span_data_bit_group_value = /*bitGroup*/ ctx[4].groupId);
    			add_location(span, file$a, 207, 16, 5940);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*chunk*/ 1 && t0_value !== (t0_value = /*bitGroup*/ ctx[4].bits + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*chunk*/ 1 && span_data_bit_group_value !== (span_data_bit_group_value = /*bitGroup*/ ctx[4].groupId)) {
    				attr_dev(span, "data-bit-group", span_data_bit_group_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(207:14) {#each hexByte.bitGroups as bitGroup}",
    		ctx
    	});

    	return block;
    }

    // (168:4) {#each chunk.hexMap as hexByte}
    function create_each_block_2(ctx) {
    	let div1;
    	let div0;
    	let code0;
    	let t0_value = /*hexByte*/ ctx[7].ascii + "";
    	let t0;
    	let code0_data_ascii_value;
    	let code0_data_hex_byte_value;
    	let t1;
    	let code1;
    	let span0;
    	let t2_value = /*hexByte*/ ctx[7].hex_word1 + "";
    	let t2;
    	let span0_data_hex_value;
    	let span0_data_four_bit_value;
    	let t3;
    	let span1;
    	let t4_value = /*hexByte*/ ctx[7].hex_word2 + "";
    	let t4;
    	let span1_data_hex_value;
    	let span1_data_four_bit_value;
    	let code1_data_ascii_value;
    	let code1_data_hex_byte_value;
    	let t5;
    	let code3;
    	let code2;
    	let code3_data_ascii_value;
    	let code3_data_bit_group_value;
    	let t6;
    	let div1_data_eight_bit_value;
    	let div1_data_hex_byte_value;
    	let div1_data_ascii_value;
    	let div1_data_bit_group_value;
    	let dispose;
    	let each_value_3 = /*hexByte*/ ctx[7].bitGroups;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			code0 = element("code");
    			t0 = text(t0_value);
    			t1 = space();
    			code1 = element("code");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			code3 = element("code");
    			code2 = element("code");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			attr_dev(code0, "class", "hex-ascii svelte-10pp6cf");
    			attr_dev(code0, "data-ascii", code0_data_ascii_value = /*hexByte*/ ctx[7].ascii);
    			attr_dev(code0, "data-hex-byte", code0_data_hex_byte_value = "" + (/*hexByte*/ ctx[7].hex_word1 + /*hexByte*/ ctx[7].hex_word2));
    			toggle_class(code0, "hide-element", !/*chunk*/ ctx[0].isASCII);
    			toggle_class(code0, "black", /*hexByte*/ ctx[7].isWhiteSpace);
    			add_location(code0, file$a, 177, 10, 4894);
    			attr_dev(span0, "class", "hex-digit svelte-10pp6cf");
    			attr_dev(span0, "data-hex", span0_data_hex_value = /*hexByte*/ ctx[7].hex_word1);
    			attr_dev(span0, "data-four-bit", span0_data_four_bit_value = /*hexByte*/ ctx[7].bin_word1);
    			add_location(span0, file$a, 188, 12, 5313);
    			attr_dev(span1, "class", "hex-digit svelte-10pp6cf");
    			attr_dev(span1, "data-hex", span1_data_hex_value = /*hexByte*/ ctx[7].hex_word2);
    			attr_dev(span1, "data-four-bit", span1_data_four_bit_value = /*hexByte*/ ctx[7].bin_word2);
    			add_location(span1, file$a, 194, 12, 5509);
    			attr_dev(code1, "data-ascii", code1_data_ascii_value = /*hexByte*/ ctx[7].ascii);
    			attr_dev(code1, "data-hex-byte", code1_data_hex_byte_value = "" + (/*hexByte*/ ctx[7].hex_word1 + /*hexByte*/ ctx[7].hex_word2));
    			attr_dev(code1, "class", "svelte-10pp6cf");
    			add_location(code1, file$a, 185, 10, 5188);
    			attr_dev(code2, "class", "svelte-10pp6cf");
    			add_location(code2, file$a, 205, 12, 5865);
    			attr_dev(code3, "class", "hex-binary bit-group svelte-10pp6cf");
    			attr_dev(code3, "data-ascii", code3_data_ascii_value = /*hexByte*/ ctx[7].ascii);
    			attr_dev(code3, "data-bit-group", code3_data_bit_group_value = /*hexByte*/ ctx[7].groupId);
    			add_location(code3, file$a, 201, 10, 5721);
    			add_location(div0, file$a, 176, 8, 4878);
    			attr_dev(div1, "class", "hex-byte svelte-10pp6cf");
    			attr_dev(div1, "data-eight-bit", div1_data_eight_bit_value = "" + (/*hexByte*/ ctx[7].bin_word1 + /*hexByte*/ ctx[7].bin_word2));
    			attr_dev(div1, "data-hex-byte", div1_data_hex_byte_value = "" + (/*hexByte*/ ctx[7].hex_word1 + /*hexByte*/ ctx[7].hex_word2));
    			attr_dev(div1, "data-ascii", div1_data_ascii_value = /*hexByte*/ ctx[7].ascii);
    			attr_dev(div1, "data-bit-group", div1_data_bit_group_value = /*hexByte*/ ctx[7].groupId);
    			add_location(div1, file$a, 168, 6, 4530);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, code0);
    			append_dev(code0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, code1);
    			append_dev(code1, span0);
    			append_dev(span0, t2);
    			append_dev(code1, t3);
    			append_dev(code1, span1);
    			append_dev(span1, t4);
    			append_dev(div0, t5);
    			append_dev(div0, code3);
    			append_dev(code3, code2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(code2, null);
    			}

    			append_dev(div1, t6);

    			dispose = [
    				listen_dev(div1, "mouseover", highlightMatchingBitGroups, false, false, false),
    				listen_dev(div1, "mouseover", highlightAsciiValueInLookupTable, false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*chunk*/ 1 && t0_value !== (t0_value = /*hexByte*/ ctx[7].ascii + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*chunk*/ 1 && code0_data_ascii_value !== (code0_data_ascii_value = /*hexByte*/ ctx[7].ascii)) {
    				attr_dev(code0, "data-ascii", code0_data_ascii_value);
    			}

    			if (dirty & /*chunk*/ 1 && code0_data_hex_byte_value !== (code0_data_hex_byte_value = "" + (/*hexByte*/ ctx[7].hex_word1 + /*hexByte*/ ctx[7].hex_word2))) {
    				attr_dev(code0, "data-hex-byte", code0_data_hex_byte_value);
    			}

    			if (dirty & /*chunk*/ 1) {
    				toggle_class(code0, "hide-element", !/*chunk*/ ctx[0].isASCII);
    			}

    			if (dirty & /*chunk*/ 1) {
    				toggle_class(code0, "black", /*hexByte*/ ctx[7].isWhiteSpace);
    			}

    			if (dirty & /*chunk*/ 1 && t2_value !== (t2_value = /*hexByte*/ ctx[7].hex_word1 + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*chunk*/ 1 && span0_data_hex_value !== (span0_data_hex_value = /*hexByte*/ ctx[7].hex_word1)) {
    				attr_dev(span0, "data-hex", span0_data_hex_value);
    			}

    			if (dirty & /*chunk*/ 1 && span0_data_four_bit_value !== (span0_data_four_bit_value = /*hexByte*/ ctx[7].bin_word1)) {
    				attr_dev(span0, "data-four-bit", span0_data_four_bit_value);
    			}

    			if (dirty & /*chunk*/ 1 && t4_value !== (t4_value = /*hexByte*/ ctx[7].hex_word2 + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*chunk*/ 1 && span1_data_hex_value !== (span1_data_hex_value = /*hexByte*/ ctx[7].hex_word2)) {
    				attr_dev(span1, "data-hex", span1_data_hex_value);
    			}

    			if (dirty & /*chunk*/ 1 && span1_data_four_bit_value !== (span1_data_four_bit_value = /*hexByte*/ ctx[7].bin_word2)) {
    				attr_dev(span1, "data-four-bit", span1_data_four_bit_value);
    			}

    			if (dirty & /*chunk*/ 1 && code1_data_ascii_value !== (code1_data_ascii_value = /*hexByte*/ ctx[7].ascii)) {
    				attr_dev(code1, "data-ascii", code1_data_ascii_value);
    			}

    			if (dirty & /*chunk*/ 1 && code1_data_hex_byte_value !== (code1_data_hex_byte_value = "" + (/*hexByte*/ ctx[7].hex_word1 + /*hexByte*/ ctx[7].hex_word2))) {
    				attr_dev(code1, "data-hex-byte", code1_data_hex_byte_value);
    			}

    			if (dirty & /*chunk*/ 1) {
    				each_value_3 = /*hexByte*/ ctx[7].bitGroups;
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(code2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}

    			if (dirty & /*chunk*/ 1 && code3_data_ascii_value !== (code3_data_ascii_value = /*hexByte*/ ctx[7].ascii)) {
    				attr_dev(code3, "data-ascii", code3_data_ascii_value);
    			}

    			if (dirty & /*chunk*/ 1 && code3_data_bit_group_value !== (code3_data_bit_group_value = /*hexByte*/ ctx[7].groupId)) {
    				attr_dev(code3, "data-bit-group", code3_data_bit_group_value);
    			}

    			if (dirty & /*chunk*/ 1 && div1_data_eight_bit_value !== (div1_data_eight_bit_value = "" + (/*hexByte*/ ctx[7].bin_word1 + /*hexByte*/ ctx[7].bin_word2))) {
    				attr_dev(div1, "data-eight-bit", div1_data_eight_bit_value);
    			}

    			if (dirty & /*chunk*/ 1 && div1_data_hex_byte_value !== (div1_data_hex_byte_value = "" + (/*hexByte*/ ctx[7].hex_word1 + /*hexByte*/ ctx[7].hex_word2))) {
    				attr_dev(div1, "data-hex-byte", div1_data_hex_byte_value);
    			}

    			if (dirty & /*chunk*/ 1 && div1_data_ascii_value !== (div1_data_ascii_value = /*hexByte*/ ctx[7].ascii)) {
    				attr_dev(div1, "data-ascii", div1_data_ascii_value);
    			}

    			if (dirty & /*chunk*/ 1 && div1_data_bit_group_value !== (div1_data_bit_group_value = /*hexByte*/ ctx[7].groupId)) {
    				attr_dev(div1, "data-bit-group", div1_data_bit_group_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(168:4) {#each chunk.hexMap as hexByte}",
    		ctx
    	});

    	return block;
    }

    // (234:14) {#each base64Digit.bitGroups as bitGroup}
    function create_each_block_1(ctx) {
    	let span;
    	let t0_value = /*bitGroup*/ ctx[4].bits + "";
    	let t0;
    	let t1;
    	let span_data_bit_group_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "bit-group svelte-10pp6cf");
    			attr_dev(span, "data-bit-group", span_data_bit_group_value = /*bitGroup*/ ctx[4].groupId);
    			toggle_class(span, "black", /*base64Digit*/ ctx[1].isPad);
    			add_location(span, file$a, 234, 16, 6792);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*chunk*/ 1 && t0_value !== (t0_value = /*bitGroup*/ ctx[4].bits + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*chunk*/ 1 && span_data_bit_group_value !== (span_data_bit_group_value = /*bitGroup*/ ctx[4].groupId)) {
    				attr_dev(span, "data-bit-group", span_data_bit_group_value);
    			}

    			if (dirty & /*chunk*/ 1) {
    				toggle_class(span, "black", /*base64Digit*/ ctx[1].isPad);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(234:14) {#each base64Digit.bitGroups as bitGroup}",
    		ctx
    	});

    	return block;
    }

    // (219:4) {#each chunk.base64Map as base64Digit}
    function create_each_block$1(ctx) {
    	let div1;
    	let div0;
    	let code1;
    	let code0;
    	let code1_data_base_value;
    	let code1_data_bit_group_value;
    	let t0;
    	let code2;
    	let t1_value = /*base64Digit*/ ctx[1].dec + "";
    	let t1;
    	let code2_data_base_value;
    	let code2_data_decimal_value;
    	let t2;
    	let code3;
    	let t3_value = /*base64Digit*/ ctx[1].b64 + "";
    	let t3;
    	let code3_data_base_value;
    	let code3_data_decimal_value;
    	let t4;
    	let div1_data_six_bit_value;
    	let div1_data_decimal_value;
    	let div1_data_base_value;
    	let div1_data_bit_group_value;
    	let dispose;
    	let each_value_1 = /*base64Digit*/ ctx[1].bitGroups;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			code1 = element("code");
    			code0 = element("code");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			code2 = element("code");
    			t1 = text(t1_value);
    			t2 = space();
    			code3 = element("code");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(code0, "class", "svelte-10pp6cf");
    			add_location(code0, file$a, 232, 12, 6713);
    			attr_dev(code1, "class", "base64-binary bit-group svelte-10pp6cf");
    			attr_dev(code1, "data-base", code1_data_base_value = /*base64Digit*/ ctx[1].b64);
    			attr_dev(code1, "data-bit-group", code1_data_bit_group_value = /*base64Digit*/ ctx[1].groupId);
    			add_location(code1, file$a, 228, 10, 6561);
    			attr_dev(code2, "class", "base64-decimal svelte-10pp6cf");
    			attr_dev(code2, "data-base", code2_data_base_value = /*base64Digit*/ ctx[1].b64);
    			attr_dev(code2, "data-decimal", code2_data_decimal_value = /*base64Digit*/ ctx[1].dec);
    			toggle_class(code2, "small-font", /*base64Digit*/ ctx[1].isPad);
    			add_location(code2, file$a, 243, 10, 7065);
    			attr_dev(code3, "class", "base64-digit svelte-10pp6cf");
    			attr_dev(code3, "data-base", code3_data_base_value = /*base64Digit*/ ctx[1].b64);
    			attr_dev(code3, "data-decimal", code3_data_decimal_value = /*base64Digit*/ ctx[1].dec);
    			add_location(code3, file$a, 250, 10, 7297);
    			add_location(div0, file$a, 227, 8, 6545);
    			attr_dev(div1, "class", "base64 svelte-10pp6cf");
    			attr_dev(div1, "data-six-bit", div1_data_six_bit_value = /*base64Digit*/ ctx[1].bin);
    			attr_dev(div1, "data-decimal", div1_data_decimal_value = /*base64Digit*/ ctx[1].dec);
    			attr_dev(div1, "data-base", div1_data_base_value = /*base64Digit*/ ctx[1].b64);
    			attr_dev(div1, "data-bit-group", div1_data_bit_group_value = /*base64Digit*/ ctx[1].groupId);
    			add_location(div1, file$a, 219, 6, 6242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, code1);
    			append_dev(code1, code0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(code0, null);
    			}

    			append_dev(div0, t0);
    			append_dev(div0, code2);
    			append_dev(code2, t1);
    			append_dev(div0, t2);
    			append_dev(div0, code3);
    			append_dev(code3, t3);
    			append_dev(div1, t4);

    			dispose = [
    				listen_dev(div1, "mouseover", highlightMatchingBitGroups, false, false, false),
    				listen_dev(div1, "mouseover", highlightBase64ValueInLookupTable, false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*chunk*/ 1) {
    				each_value_1 = /*base64Digit*/ ctx[1].bitGroups;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(code0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*chunk*/ 1 && code1_data_base_value !== (code1_data_base_value = /*base64Digit*/ ctx[1].b64)) {
    				attr_dev(code1, "data-base", code1_data_base_value);
    			}

    			if (dirty & /*chunk*/ 1 && code1_data_bit_group_value !== (code1_data_bit_group_value = /*base64Digit*/ ctx[1].groupId)) {
    				attr_dev(code1, "data-bit-group", code1_data_bit_group_value);
    			}

    			if (dirty & /*chunk*/ 1 && t1_value !== (t1_value = /*base64Digit*/ ctx[1].dec + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*chunk*/ 1 && code2_data_base_value !== (code2_data_base_value = /*base64Digit*/ ctx[1].b64)) {
    				attr_dev(code2, "data-base", code2_data_base_value);
    			}

    			if (dirty & /*chunk*/ 1 && code2_data_decimal_value !== (code2_data_decimal_value = /*base64Digit*/ ctx[1].dec)) {
    				attr_dev(code2, "data-decimal", code2_data_decimal_value);
    			}

    			if (dirty & /*chunk*/ 1) {
    				toggle_class(code2, "small-font", /*base64Digit*/ ctx[1].isPad);
    			}

    			if (dirty & /*chunk*/ 1 && t3_value !== (t3_value = /*base64Digit*/ ctx[1].b64 + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*chunk*/ 1 && code3_data_base_value !== (code3_data_base_value = /*base64Digit*/ ctx[1].b64)) {
    				attr_dev(code3, "data-base", code3_data_base_value);
    			}

    			if (dirty & /*chunk*/ 1 && code3_data_decimal_value !== (code3_data_decimal_value = /*base64Digit*/ ctx[1].dec)) {
    				attr_dev(code3, "data-decimal", code3_data_decimal_value);
    			}

    			if (dirty & /*chunk*/ 1 && div1_data_six_bit_value !== (div1_data_six_bit_value = /*base64Digit*/ ctx[1].bin)) {
    				attr_dev(div1, "data-six-bit", div1_data_six_bit_value);
    			}

    			if (dirty & /*chunk*/ 1 && div1_data_decimal_value !== (div1_data_decimal_value = /*base64Digit*/ ctx[1].dec)) {
    				attr_dev(div1, "data-decimal", div1_data_decimal_value);
    			}

    			if (dirty & /*chunk*/ 1 && div1_data_base_value !== (div1_data_base_value = /*base64Digit*/ ctx[1].b64)) {
    				attr_dev(div1, "data-base", div1_data_base_value);
    			}

    			if (dirty & /*chunk*/ 1 && div1_data_bit_group_value !== (div1_data_bit_group_value = /*base64Digit*/ ctx[1].groupId)) {
    				attr_dev(div1, "data-bit-group", div1_data_bit_group_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(219:4) {#each chunk.base64Map as base64Digit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let each_value_2 = /*chunk*/ ctx[0].hexMap;
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*chunk*/ ctx[0].base64Map;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "hex-map svelte-10pp6cf");
    			add_location(div0, file$a, 166, 2, 4466);
    			attr_dev(div1, "class", "base64-map svelte-10pp6cf");
    			add_location(div1, file$a, 217, 2, 6168);
    			attr_dev(div2, "class", "single-chunk svelte-10pp6cf");
    			add_location(div2, file$a, 165, 0, 4437);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div2, t);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*chunk, highlightMatchingBitGroups, highlightAsciiValueInLookupTable*/ 1) {
    				each_value_2 = /*chunk*/ ctx[0].hexMap;
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*chunk, highlightMatchingBitGroups, highlightBase64ValueInLookupTable*/ 1) {
    				each_value = /*chunk*/ ctx[0].base64Map;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function highlightBase64ValueInLookupTable(event) {
    	const selector = `.base64-lookup[data-base="${this.dataset.base}"]`;
    	const base64Lookup = document.querySelector(selector);
    	if (!base64Lookup) return;
    	base64Lookup.classList.add("highlight-base64");
    	this.classList.add("highlight-base64");
    	base64Lookup.addEventListener("mouseleave", removeBase64Highlight);
    	this.addEventListener("mouseleave", removeBase64Highlight);
    }

    function removeBase64Highlight(event) {
    	const selector = ".highlight-base64";
    	const matchingBase64 = document.querySelectorAll(selector);
    	if (!matchingBase64) return;
    	matchingBase64.forEach(group => group.onmouseleave = null);
    	matchingBase64.forEach(group => group.classList.remove("highlight-base64"));
    }

    function highlightAsciiValueInLookupTable(event) {
    	const selector = `.ascii-lookup[data-hex-byte="${this.dataset.hexByte}"]`;
    	const asciiLookup = document.querySelector(selector);
    	if (!asciiLookup) return;
    	asciiLookup.classList.add("highlight-ascii");
    	this.classList.add("highlight-ascii");
    	asciiLookup.addEventListener("mouseleave", removeAsciiHighlight);
    	this.addEventListener("mouseleave", removeAsciiHighlight);
    }

    function removeAsciiHighlight(event) {
    	const selector = ".highlight-ascii";
    	const matchingAscii = document.querySelectorAll(selector);
    	if (!matchingAscii) return;
    	matchingAscii.forEach(group => group.onmouseleave = null);
    	matchingAscii.forEach(group => group.classList.remove("highlight-ascii"));
    }

    function highlightMatchingBitGroups(event) {
    	const selector = `*[data-bit-group="${this.dataset.bitGroup}"]`;
    	const matchingGroups = document.querySelectorAll(selector);
    	if (!matchingGroups) return;
    	matchingGroups.forEach(group => group.classList.remove("bit-group"));
    	matchingGroups.forEach(group => group.querySelectorAll("*[data-bit-group]").forEach(group => group.classList.remove("bit-group")));
    	matchingGroups.forEach(group => group.classList.add("highlight-bit-group"));
    	matchingGroups.forEach(group => group.addEventListener("mouseleave", removeBitGroupHighlight));
    }

    function removeBitGroupHighlight(event) {
    	const selector = `*[data-bit-group="${this.dataset.bitGroup}"]`;
    	const matchingGroups = document.querySelectorAll(selector);
    	if (!matchingGroups) return;
    	matchingGroups.forEach(group => group.onmouseleave = null);
    	matchingGroups.forEach(group => group.classList.remove("highlight-bit-group"));
    	matchingGroups.forEach(group => group.classList.add("bit-group"));
    	matchingGroups.forEach(group => group.querySelectorAll("*[data-bit-group]").forEach(group => group.classList.add("bit-group")));
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { chunk = {} } = $$props;
    	const writable_props = ["chunk"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EncodedChunk> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("chunk" in $$props) $$invalidate(0, chunk = $$props.chunk);
    	};

    	$$self.$capture_state = () => {
    		return { chunk };
    	};

    	$$self.$inject_state = $$props => {
    		if ("chunk" in $$props) $$invalidate(0, chunk = $$props.chunk);
    	};

    	return [chunk];
    }

    class EncodedChunk extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { chunk: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EncodedChunk",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get chunk() {
    		return this.$$.ctx[0];
    	}

    	set chunk(chunk) {
    		this.$set({ chunk });
    		flush();
    	}
    }

    /* src/components/Visualization.svelte generated by Svelte v3.17.3 */
    const file$b = "src/components/Visualization.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (122:6) {#each chunks as chunk}
    function create_each_block$2(ctx) {
    	let current;

    	const encodedchunk = new EncodedChunk({
    			props: { chunk: /*chunk*/ ctx[12] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(encodedchunk.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(encodedchunk, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const encodedchunk_changes = {};
    			if (dirty & /*chunks*/ 1) encodedchunk_changes.chunk = /*chunk*/ ctx[12];
    			encodedchunk.$set(encodedchunk_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(encodedchunk.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(encodedchunk.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(encodedchunk, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(122:6) {#each chunks as chunk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div7;
    	let div6;
    	let div4;
    	let div1;
    	let div0;
    	let code0;
    	let t1;
    	let code1;
    	let t3;
    	let code2;
    	let t5;
    	let div3;
    	let div2;
    	let code3;
    	let t7;
    	let code4;
    	let t9;
    	let code5;
    	let t11;
    	let div5;
    	let current;
    	let each_value = /*chunks*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			code0 = element("code");
    			code0.textContent = "ASCII";
    			t1 = space();
    			code1 = element("code");
    			code1.textContent = "Hex";
    			t3 = space();
    			code2 = element("code");
    			code2.textContent = "8-bit";
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			code3 = element("code");
    			code3.textContent = "6-bit";
    			t7 = space();
    			code4 = element("code");
    			code4.textContent = "Decimal";
    			t9 = space();
    			code5 = element("code");
    			code5.textContent = "Base64";
    			t11 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(code0, "class", "svelte-i53wgk");
    			toggle_class(code0, "hide-element", !/*isASCII*/ ctx[1]);
    			add_location(code0, file$b, 107, 10, 2186);
    			attr_dev(code1, "class", "svelte-i53wgk");
    			add_location(code1, file$b, 108, 10, 2245);
    			attr_dev(code2, "class", "svelte-i53wgk");
    			add_location(code2, file$b, 109, 10, 2272);
    			add_location(div0, file$b, 106, 8, 2170);
    			attr_dev(div1, "class", "input-key svelte-i53wgk");
    			add_location(div1, file$b, 105, 6, 2138);
    			attr_dev(code3, "class", "svelte-i53wgk");
    			add_location(code3, file$b, 114, 10, 2374);
    			attr_dev(code4, "class", "svelte-i53wgk");
    			add_location(code4, file$b, 115, 10, 2403);
    			attr_dev(code5, "class", "svelte-i53wgk");
    			add_location(code5, file$b, 116, 10, 2434);
    			add_location(div2, file$b, 113, 8, 2358);
    			attr_dev(div3, "class", "output-key svelte-i53wgk");
    			add_location(div3, file$b, 112, 6, 2325);
    			attr_dev(div4, "class", "encoding-key svelte-i53wgk");
    			add_location(div4, file$b, 104, 4, 2105);
    			attr_dev(div5, "class", "encoding-map svelte-i53wgk");
    			add_location(div5, file$b, 120, 4, 2497);
    			attr_dev(div6, "class", "visualization svelte-i53wgk");
    			add_location(div6, file$b, 103, 2, 2073);
    			attr_dev(div7, "class", "visualization-wrapper svelte-i53wgk");
    			add_location(div7, file$b, 102, 0, 2035);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, code0);
    			append_dev(div0, t1);
    			append_dev(div0, code1);
    			append_dev(div0, t3);
    			append_dev(div0, code2);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, code3);
    			append_dev(div2, t7);
    			append_dev(div2, code4);
    			append_dev(div2, t9);
    			append_dev(div2, code5);
    			append_dev(div6, t11);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isASCII*/ 2) {
    				toggle_class(code0, "hide-element", !/*isASCII*/ ctx[1]);
    			}

    			if (dirty & /*chunks*/ 1) {
    				each_value = /*chunks*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div5, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let showEncodeForm;
    	let plainTextEncoding;
    	let outputIsAscii;
    	let chunks = [];

    	onMount(() => {
    		$$invalidate(9, showEncodeForm = true);
    		$$invalidate(10, plainTextEncoding = "ASCII");
    		$$invalidate(11, outputIsAscii = true);
    	});

    	const update = updatedChunks => $$invalidate(0, chunks = updatedChunks);

    	function reset() {
    		$$invalidate(10, plainTextEncoding = "ASCII");
    		$$invalidate(11, outputIsAscii = true);
    		$$invalidate(0, chunks = []);
    	}

    	function handleFormToggled(encodeFormToggled) {
    		reset();
    		$$invalidate(9, showEncodeForm = encodeFormToggled);
    	}

    	function handleInputTextChanged() {
    		$$invalidate(0, chunks = []);
    	}

    	function handlePlainTextEncodingChanged(event) {
    		if (showEncodeForm) {
    			$$invalidate(0, chunks = []);
    			$$invalidate(10, plainTextEncoding = event.detail.value);
    		}
    	}

    	function handleInputBase64EncodingChanged(event) {
    		if (!showEncodeForm) {
    			$$invalidate(0, chunks = []);
    		}
    	}

    	function handleOutputIsAsciiChanged(isASCII) {
    		if (!showEncodeForm) {
    			$$invalidate(0, chunks = []);
    			$$invalidate(11, outputIsAscii = isASCII);
    		}
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("showEncodeForm" in $$props) $$invalidate(9, showEncodeForm = $$props.showEncodeForm);
    		if ("plainTextEncoding" in $$props) $$invalidate(10, plainTextEncoding = $$props.plainTextEncoding);
    		if ("outputIsAscii" in $$props) $$invalidate(11, outputIsAscii = $$props.outputIsAscii);
    		if ("chunks" in $$props) $$invalidate(0, chunks = $$props.chunks);
    		if ("isASCII" in $$props) $$invalidate(1, isASCII = $$props.isASCII);
    	};

    	let isASCII;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*showEncodeForm, plainTextEncoding, outputIsAscii*/ 3584) {
    			 $$invalidate(1, isASCII = showEncodeForm
    			? plainTextEncoding == "ASCII"
    			: outputIsAscii);
    		}
    	};

    	return [
    		chunks,
    		isASCII,
    		update,
    		reset,
    		handleFormToggled,
    		handleInputTextChanged,
    		handlePlainTextEncodingChanged,
    		handleInputBase64EncodingChanged,
    		handleOutputIsAsciiChanged
    	];
    }

    class Visualization extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			update: 2,
    			reset: 3,
    			handleFormToggled: 4,
    			handleInputTextChanged: 5,
    			handlePlainTextEncodingChanged: 6,
    			handleInputBase64EncodingChanged: 7,
    			handleOutputIsAsciiChanged: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Visualization",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get update() {
    		return this.$$.ctx[2];
    	}

    	set update(value) {
    		throw new Error("<Visualization>: Cannot set read-only property 'update'");
    	}

    	get reset() {
    		return this.$$.ctx[3];
    	}

    	set reset(value) {
    		throw new Error("<Visualization>: Cannot set read-only property 'reset'");
    	}

    	get handleFormToggled() {
    		return this.$$.ctx[4];
    	}

    	set handleFormToggled(value) {
    		throw new Error("<Visualization>: Cannot set read-only property 'handleFormToggled'");
    	}

    	get handleInputTextChanged() {
    		return this.$$.ctx[5];
    	}

    	set handleInputTextChanged(value) {
    		throw new Error("<Visualization>: Cannot set read-only property 'handleInputTextChanged'");
    	}

    	get handlePlainTextEncodingChanged() {
    		return this.$$.ctx[6];
    	}

    	set handlePlainTextEncodingChanged(value) {
    		throw new Error("<Visualization>: Cannot set read-only property 'handlePlainTextEncodingChanged'");
    	}

    	get handleInputBase64EncodingChanged() {
    		return this.$$.ctx[7];
    	}

    	set handleInputBase64EncodingChanged(value) {
    		throw new Error("<Visualization>: Cannot set read-only property 'handleInputBase64EncodingChanged'");
    	}

    	get handleOutputIsAsciiChanged() {
    		return this.$$.ctx[8];
    	}

    	set handleOutputIsAsciiChanged(value) {
    		throw new Error("<Visualization>: Cannot set read-only property 'handleOutputIsAsciiChanged'");
    	}
    }

    /* src/components/LookupTables.svelte generated by Svelte v3.17.3 */
    const file$c = "src/components/LookupTables.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (142:10) {#each asciiMap as ascii}
    function create_each_block_3$1(ctx) {
    	let div;
    	let code0;
    	let t0_value = /*ascii*/ ctx[20].ascii + "";
    	let t0;
    	let t1;
    	let code1;
    	let t2_value = /*ascii*/ ctx[20].hex + "";
    	let t2;
    	let t3;
    	let code2;
    	let t4_value = /*ascii*/ ctx[20].binWord1 + "";
    	let t4;
    	let t5;
    	let t6_value = /*ascii*/ ctx[20].binWord2 + "";
    	let t6;
    	let div_data_ascii_value;
    	let div_data_hex_byte_value;
    	let div_data_eight_bit_value;
    	let div_data_decimal_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			code0 = element("code");
    			t0 = text(t0_value);
    			t1 = space();
    			code1 = element("code");
    			t2 = text(t2_value);
    			t3 = space();
    			code2 = element("code");
    			t4 = text(t4_value);
    			t5 = space();
    			t6 = text(t6_value);
    			attr_dev(code0, "class", "svelte-ose6oi");
    			add_location(code0, file$c, 148, 14, 3305);
    			attr_dev(code1, "class", "svelte-ose6oi");
    			add_location(code1, file$c, 149, 14, 3346);
    			attr_dev(code2, "class", "svelte-ose6oi");
    			add_location(code2, file$c, 150, 14, 3385);
    			attr_dev(div, "class", "ascii-lookup svelte-ose6oi");
    			attr_dev(div, "data-ascii", div_data_ascii_value = /*ascii*/ ctx[20].ascii);
    			attr_dev(div, "data-hex-byte", div_data_hex_byte_value = /*ascii*/ ctx[20].hex);
    			attr_dev(div, "data-eight-bit", div_data_eight_bit_value = /*ascii*/ ctx[20].bin);
    			attr_dev(div, "data-decimal", div_data_decimal_value = /*ascii*/ ctx[20].dec);
    			add_location(div, file$c, 142, 12, 3091);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, code0);
    			append_dev(code0, t0);
    			append_dev(div, t1);
    			append_dev(div, code1);
    			append_dev(code1, t2);
    			append_dev(div, t3);
    			append_dev(div, code2);
    			append_dev(code2, t4);
    			append_dev(code2, t5);
    			append_dev(code2, t6);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(142:10) {#each asciiMap as ascii}",
    		ctx
    	});

    	return block;
    }

    // (140:6) {#each asciiMapChunked as asciiMap}
    function create_each_block_2$1(ctx) {
    	let div;
    	let t;
    	let each_value_3 = /*asciiMap*/ ctx[17];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "ascii-lookup-chunk svelte-ose6oi");
    			add_location(div, file$c, 140, 8, 3010);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*asciiMapChunked*/ 8) {
    				each_value_3 = /*asciiMap*/ ctx[17];
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(140:6) {#each asciiMapChunked as asciiMap}",
    		ctx
    	});

    	return block;
    }

    // (167:10) {#each base64Map as base64}
    function create_each_block_1$1(ctx) {
    	let div;
    	let code0;
    	let t0_value = /*base64*/ ctx[14].dec + "";
    	let t0;
    	let t1;
    	let code1;
    	let t2_value = /*base64*/ ctx[14].bin + "";
    	let t2;
    	let t3;
    	let code2;
    	let t4_value = /*base64*/ ctx[14].b64 + "";
    	let t4;
    	let div_data_base_value;
    	let div_data_six_bit_value;
    	let div_data_decimal_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			code0 = element("code");
    			t0 = text(t0_value);
    			t1 = space();
    			code1 = element("code");
    			t2 = text(t2_value);
    			t3 = space();
    			code2 = element("code");
    			t4 = text(t4_value);
    			attr_dev(code0, "class", "svelte-ose6oi");
    			add_location(code0, file$c, 172, 14, 4027);
    			attr_dev(code1, "class", "svelte-ose6oi");
    			add_location(code1, file$c, 173, 14, 4067);
    			attr_dev(code2, "class", "svelte-ose6oi");
    			add_location(code2, file$c, 174, 14, 4107);
    			attr_dev(div, "class", "base64-lookup svelte-ose6oi");
    			attr_dev(div, "data-base", div_data_base_value = /*base64*/ ctx[14].b64);
    			attr_dev(div, "data-six-bit", div_data_six_bit_value = /*base64*/ ctx[14].bin);
    			attr_dev(div, "data-decimal", div_data_decimal_value = /*base64*/ ctx[14].dec);
    			add_location(div, file$c, 167, 12, 3854);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, code0);
    			append_dev(code0, t0);
    			append_dev(div, t1);
    			append_dev(div, code1);
    			append_dev(code1, t2);
    			append_dev(div, t3);
    			append_dev(div, code2);
    			append_dev(code2, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*base64MapChunked*/ 2 && t0_value !== (t0_value = /*base64*/ ctx[14].dec + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*base64MapChunked*/ 2 && t2_value !== (t2_value = /*base64*/ ctx[14].bin + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*base64MapChunked*/ 2 && t4_value !== (t4_value = /*base64*/ ctx[14].b64 + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*base64MapChunked*/ 2 && div_data_base_value !== (div_data_base_value = /*base64*/ ctx[14].b64)) {
    				attr_dev(div, "data-base", div_data_base_value);
    			}

    			if (dirty & /*base64MapChunked*/ 2 && div_data_six_bit_value !== (div_data_six_bit_value = /*base64*/ ctx[14].bin)) {
    				attr_dev(div, "data-six-bit", div_data_six_bit_value);
    			}

    			if (dirty & /*base64MapChunked*/ 2 && div_data_decimal_value !== (div_data_decimal_value = /*base64*/ ctx[14].dec)) {
    				attr_dev(div, "data-decimal", div_data_decimal_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(167:10) {#each base64Map as base64}",
    		ctx
    	});

    	return block;
    }

    // (165:6) {#each base64MapChunked as base64Map}
    function create_each_block$3(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*base64Map*/ ctx[11];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "base64-lookup-chunk svelte-ose6oi");
    			add_location(div, file$c, 165, 8, 3770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*base64MapChunked*/ 2) {
    				each_value_1 = /*base64Map*/ ctx[11];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(165:6) {#each base64MapChunked as base64Map}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div4;
    	let div1;
    	let h20;
    	let t1;
    	let div0;
    	let t2;
    	let div3;
    	let h21;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let div2;
    	let each_value_2 = /*asciiMapChunked*/ ctx[3];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	let each_value = /*base64MapChunked*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "ASCII Map (Printable Characters)";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div3 = element("div");
    			h21 = element("h2");
    			t3 = text("Base64 Alphabet (");
    			t4 = text(/*b64AlphabetDetail*/ ctx[2]);
    			t5 = text(")");
    			t6 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h20, "class", "svelte-ose6oi");
    			add_location(h20, file$c, 137, 4, 2881);
    			attr_dev(div0, "class", "ascii-lookup-table svelte-ose6oi");
    			add_location(div0, file$c, 138, 4, 2927);
    			attr_dev(div1, "class", "table-wrapper svelte-ose6oi");
    			add_location(div1, file$c, 136, 2, 2849);
    			attr_dev(h21, "class", "svelte-ose6oi");
    			add_location(h21, file$c, 158, 4, 3552);
    			attr_dev(div2, "class", "base64-lookup-table svelte-ose6oi");
    			toggle_class(div2, "blue", /*showEncodeForm*/ ctx[0]);
    			toggle_class(div2, "green", !/*showEncodeForm*/ ctx[0]);
    			add_location(div2, file$c, 159, 4, 3603);
    			attr_dev(div3, "class", "table-wrapper svelte-ose6oi");
    			add_location(div3, file$c, 157, 2, 3520);
    			attr_dev(div4, "class", "lookup-tables svelte-ose6oi");
    			add_location(div4, file$c, 135, 0, 2819);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, h20);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, h21);
    			append_dev(h21, t3);
    			append_dev(h21, t4);
    			append_dev(h21, t5);
    			append_dev(div3, t6);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*asciiMapChunked*/ 8) {
    				each_value_2 = /*asciiMapChunked*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*b64AlphabetDetail*/ 4) set_data_dev(t4, /*b64AlphabetDetail*/ ctx[2]);

    			if (dirty & /*base64MapChunked*/ 2) {
    				each_value = /*base64MapChunked*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*showEncodeForm*/ 1) {
    				toggle_class(div2, "blue", /*showEncodeForm*/ ctx[0]);
    			}

    			if (dirty & /*showEncodeForm*/ 1) {
    				toggle_class(div2, "green", !/*showEncodeForm*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let showEncodeForm;
    	let outputBase64Encoding;
    	let inputBase64Encoding;
    	const asciiMapChunked = getAsciiPrintableMap();

    	onMount(() => {
    		$$invalidate(0, showEncodeForm = true);
    		$$invalidate(8, outputBase64Encoding = "base64url");
    		$$invalidate(9, inputBase64Encoding = "base64url");
    	});

    	function handleFormToggled(encodeFormToggled) {
    		reset();
    		$$invalidate(0, showEncodeForm = encodeFormToggled);
    	}

    	function reset() {
    		$$invalidate(8, outputBase64Encoding = "base64url");
    		$$invalidate(9, inputBase64Encoding = "base64url");
    	}

    	function handleOutputBase64EncodingChanged(event) {
    		if (showEncodeForm) {
    			$$invalidate(8, outputBase64Encoding = event.detail.value);
    		}
    	}

    	function handleInputBase64EncodingChanged(event) {
    		if (!showEncodeForm) {
    			$$invalidate(9, inputBase64Encoding = event.detail.value);
    		}
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("showEncodeForm" in $$props) $$invalidate(0, showEncodeForm = $$props.showEncodeForm);
    		if ("outputBase64Encoding" in $$props) $$invalidate(8, outputBase64Encoding = $$props.outputBase64Encoding);
    		if ("inputBase64Encoding" in $$props) $$invalidate(9, inputBase64Encoding = $$props.inputBase64Encoding);
    		if ("base64Encoding" in $$props) $$invalidate(10, base64Encoding = $$props.base64Encoding);
    		if ("base64MapChunked" in $$props) $$invalidate(1, base64MapChunked = $$props.base64MapChunked);
    		if ("b64AlphabetDetail" in $$props) $$invalidate(2, b64AlphabetDetail = $$props.b64AlphabetDetail);
    	};

    	let base64Encoding;
    	let base64MapChunked;
    	let b64AlphabetDetail;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*showEncodeForm, outputBase64Encoding, inputBase64Encoding*/ 769) {
    			 $$invalidate(10, base64Encoding = showEncodeForm
    			? outputBase64Encoding
    			: inputBase64Encoding);
    		}

    		if ($$self.$$.dirty & /*base64Encoding*/ 1024) {
    			 $$invalidate(1, base64MapChunked = getBase64Map(base64Encoding));
    		}

    		if ($$self.$$.dirty & /*base64Encoding*/ 1024) {
    			 $$invalidate(2, b64AlphabetDetail = base64Encoding == "base64"
    			? "Standard"
    			: "URL and Filename safe");
    		}
    	};

    	return [
    		showEncodeForm,
    		base64MapChunked,
    		b64AlphabetDetail,
    		asciiMapChunked,
    		handleFormToggled,
    		reset,
    		handleOutputBase64EncodingChanged,
    		handleInputBase64EncodingChanged
    	];
    }

    class LookupTables extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			handleFormToggled: 4,
    			reset: 5,
    			handleOutputBase64EncodingChanged: 6,
    			handleInputBase64EncodingChanged: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LookupTables",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get handleFormToggled() {
    		return this.$$.ctx[4];
    	}

    	set handleFormToggled(value) {
    		throw new Error("<LookupTables>: Cannot set read-only property 'handleFormToggled'");
    	}

    	get reset() {
    		return this.$$.ctx[5];
    	}

    	set reset(value) {
    		throw new Error("<LookupTables>: Cannot set read-only property 'reset'");
    	}

    	get handleOutputBase64EncodingChanged() {
    		return this.$$.ctx[6];
    	}

    	set handleOutputBase64EncodingChanged(value) {
    		throw new Error("<LookupTables>: Cannot set read-only property 'handleOutputBase64EncodingChanged'");
    	}

    	get handleInputBase64EncodingChanged() {
    		return this.$$.ctx[7];
    	}

    	set handleInputBase64EncodingChanged(value) {
    		throw new Error("<LookupTables>: Cannot set read-only property 'handleInputBase64EncodingChanged'");
    	}
    }

    /* src/components/MainForm.svelte generated by Svelte v3.17.3 */
    const file$d = "src/components/MainForm.svelte";

    // (139:4) {:else}
    function create_else_block$1(ctx) {
    	let current;
    	let decodeform_props = {};
    	const decodeform = new DecodeForm({ props: decodeform_props, $$inline: true });
    	/*decodeform_binding*/ ctx[17](decodeform);
    	decodeform.$on("encodedTextChanged", /*encodedTextChanged*/ ctx[9]);
    	decodeform.$on("inputEncodingChanged", /*inputBase64EncodingChanged*/ ctx[12]);
    	decodeform.$on("decodingSucceeded", /*decodingSucceeded*/ ctx[14]);
    	decodeform.$on("errorOccurred", /*errorOccurred*/ ctx[15]);

    	const block = {
    		c: function create() {
    			create_component(decodeform.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(decodeform, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const decodeform_changes = {};
    			decodeform.$set(decodeform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(decodeform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(decodeform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*decodeform_binding*/ ctx[17](null);
    			destroy_component(decodeform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(139:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (130:4) {#if showEncodeForm}
    function create_if_block$5(ctx) {
    	let current;
    	let encodeform_props = {};
    	const encodeform = new EncodeForm({ props: encodeform_props, $$inline: true });
    	/*encodeform_binding*/ ctx[16](encodeform);
    	encodeform.$on("plainTextChanged", /*plainTextChanged*/ ctx[8]);
    	encodeform.$on("plainTextEncodingChanged", /*plainTextEncodingChanged*/ ctx[10]);
    	encodeform.$on("outputEncodingChanged", /*outputBase64EncodingChanged*/ ctx[11]);
    	encodeform.$on("encodingSucceeded", /*encodingSucceeded*/ ctx[13]);
    	encodeform.$on("errorOccurred", /*errorOccurred*/ ctx[15]);

    	const block = {
    		c: function create() {
    			create_component(encodeform.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(encodeform, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const encodeform_changes = {};
    			encodeform.$set(encodeform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(encodeform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(encodeform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*encodeform_binding*/ ctx[16](null);
    			destroy_component(encodeform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(130:4) {#if showEncodeForm}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let t2;
    	let t3;
    	let current;
    	const formtitle = new FormTitle({ $$inline: true });
    	formtitle.$on("formToggled", /*formToggled*/ ctx[6]);
    	formtitle.$on("resetForm", /*resetForm*/ ctx[7]);
    	const if_block_creators = [create_if_block$5, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*showEncodeForm*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let formresults_props = {};
    	const formresults = new FormResults({ props: formresults_props, $$inline: true });
    	/*formresults_binding*/ ctx[18](formresults);
    	let visualization_1_props = {};

    	const visualization_1 = new Visualization({
    			props: visualization_1_props,
    			$$inline: true
    		});

    	/*visualization_1_binding*/ ctx[19](visualization_1);
    	let lookuptables_1_props = {};

    	const lookuptables_1 = new LookupTables({
    			props: lookuptables_1_props,
    			$$inline: true
    		});

    	/*lookuptables_1_binding*/ ctx[20](lookuptables_1);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(formtitle.$$.fragment);
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			create_component(formresults.$$.fragment);
    			t2 = space();
    			create_component(visualization_1.$$.fragment);
    			t3 = space();
    			create_component(lookuptables_1.$$.fragment);
    			attr_dev(div0, "class", "form-group svelte-ikk6by");
    			add_location(div0, file$d, 124, 2, 3167);
    			attr_dev(div1, "class", "main-form svelte-ikk6by");
    			add_location(div1, file$d, 123, 0, 3141);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(formtitle, div0, null);
    			append_dev(div0, t0);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div1, t1);
    			mount_component(formresults, div1, null);
    			insert_dev(target, t2, anchor);
    			mount_component(visualization_1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(lookuptables_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}

    			const formresults_changes = {};
    			formresults.$set(formresults_changes);
    			const visualization_1_changes = {};
    			visualization_1.$set(visualization_1_changes);
    			const lookuptables_1_changes = {};
    			lookuptables_1.$set(lookuptables_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formtitle.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(formresults.$$.fragment, local);
    			transition_in(visualization_1.$$.fragment, local);
    			transition_in(lookuptables_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formtitle.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(formresults.$$.fragment, local);
    			transition_out(visualization_1.$$.fragment, local);
    			transition_out(lookuptables_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(formtitle);
    			if_blocks[current_block_type_index].d();
    			/*formresults_binding*/ ctx[18](null);
    			destroy_component(formresults);
    			if (detaching) detach_dev(t2);
    			/*visualization_1_binding*/ ctx[19](null);
    			destroy_component(visualization_1, detaching);
    			if (detaching) detach_dev(t3);
    			/*lookuptables_1_binding*/ ctx[20](null);
    			destroy_component(lookuptables_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let showEncodeForm = true;
    	let encodeForm;
    	let decodeForm;
    	let results;
    	let lookuptables;
    	let visualization;

    	function formToggled(event) {
    		$$invalidate(0, showEncodeForm = event.detail.value);
    		results.handleFormToggled(showEncodeForm);
    		lookuptables.handleFormToggled(showEncodeForm);
    		visualization.handleFormToggled(showEncodeForm);
    	}

    	function resetForm() {
    		if (showEncodeForm) {
    			encodeForm.reset();
    		} else {
    			decodeForm.reset();
    		}

    		results.reset();
    		lookuptables.reset();
    		visualization.reset();
    	}

    	function plainTextChanged(event) {
    		results.handlePlainTextChanged(event);
    		visualization.handleInputTextChanged();
    	}

    	function encodedTextChanged(event) {
    		results.handleEncodedTextChanged(event);
    		visualization.handleInputTextChanged();
    	}

    	function plainTextEncodingChanged(event) {
    		results.handlePlainTextEncodingChanged(event);
    		visualization.handlePlainTextEncodingChanged(event);
    	}

    	function outputBase64EncodingChanged(event) {
    		results.handleOutputBase64EncodingChanged(event);
    		lookuptables.handleOutputBase64EncodingChanged(event);
    	}

    	function inputBase64EncodingChanged(event) {
    		results.handleInputBase64EncodingChanged(event);
    		lookuptables.handleInputBase64EncodingChanged(event);
    		visualization.handleInputBase64EncodingChanged();
    	}

    	function encodingSucceeded(event) {
    		let { outputText, chunks } = event.detail;
    		results.handleOutputEncodedTextChanged(outputText);
    		visualization.update(chunks);
    	}

    	function decodingSucceeded(event) {
    		let { outputText, chunks, totalBytesOutput, isASCII } = event.detail;
    		results.handleOutputDecodedTextChanged(outputText);
    		results.handleTotalBytesOutChanged(totalBytesOutput);
    		results.handleOutputIsAsciiChanged(isASCII);
    		visualization.handleOutputIsAsciiChanged(isASCII);
    		visualization.update(chunks);
    	}

    	function errorOccurred(event) {
    		create({
    			message: event.detail.error,
    			type: "is-warning",
    			position: "is-top",
    			duration: 3500,
    			icon: true,
    			showClose: false
    		});

    		if (showEncodeForm) {
    			encodeForm.focus();
    		} else {
    			decodeForm.focus();
    		}
    	}

    	function encodeform_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, encodeForm = $$value);
    		});
    	}

    	function decodeform_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, decodeForm = $$value);
    		});
    	}

    	function formresults_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, results = $$value);
    		});
    	}

    	function visualization_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(5, visualization = $$value);
    		});
    	}

    	function lookuptables_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, lookuptables = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("showEncodeForm" in $$props) $$invalidate(0, showEncodeForm = $$props.showEncodeForm);
    		if ("encodeForm" in $$props) $$invalidate(1, encodeForm = $$props.encodeForm);
    		if ("decodeForm" in $$props) $$invalidate(2, decodeForm = $$props.decodeForm);
    		if ("results" in $$props) $$invalidate(3, results = $$props.results);
    		if ("lookuptables" in $$props) $$invalidate(4, lookuptables = $$props.lookuptables);
    		if ("visualization" in $$props) $$invalidate(5, visualization = $$props.visualization);
    	};

    	return [
    		showEncodeForm,
    		encodeForm,
    		decodeForm,
    		results,
    		lookuptables,
    		visualization,
    		formToggled,
    		resetForm,
    		plainTextChanged,
    		encodedTextChanged,
    		plainTextEncodingChanged,
    		outputBase64EncodingChanged,
    		inputBase64EncodingChanged,
    		encodingSucceeded,
    		decodingSucceeded,
    		errorOccurred,
    		encodeform_binding,
    		decodeform_binding,
    		formresults_binding,
    		visualization_1_binding,
    		lookuptables_1_binding
    	];
    }

    class MainForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MainForm",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.17.3 */
    const file$e = "src/App.svelte";

    function create_fragment$f(ctx) {
    	let t;
    	let main;
    	let current;
    	const mainform = new MainForm({ $$inline: true });

    	const block = {
    		c: function create() {
    			t = space();
    			main = element("main");
    			create_component(mainform.$$.fragment);
    			document.title = "Base64 Visualizer";
    			attr_dev(main, "class", "svelte-ispmb0");
    			add_location(main, file$e, 28, 0, 441);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(mainform, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mainform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mainform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(main);
    			destroy_component(mainform);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

}());
//# sourceMappingURL=bundle.js.map
