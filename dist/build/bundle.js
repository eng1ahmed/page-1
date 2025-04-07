
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
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
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
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
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        const options = { direction: 'both' };
        let config = fn(node, params, options);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
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
            if (running_program || pending_program) {
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
                        config = config(options);
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

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Sidebar.svelte generated by Svelte v3.59.2 */
    const file$5 = "src\\components\\Sidebar.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (84:6) {#each menuItems as item}
    function create_each_block_1$2(ctx) {
    	let button;
    	let span;
    	let t0_value = /*item*/ ctx[13].icon + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*item*/ ctx[13]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "icon svelte-1l75b61");
    			add_location(span, file$5, 89, 10, 3095);
    			attr_dev(button, "class", "menu-item svelte-1l75b61");
    			toggle_class(button, "active", /*activeMenuItem*/ ctx[1] === /*item*/ ctx[13].id);
    			add_location(button, file$5, 84, 8, 2935);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);
    			append_dev(span, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*activeMenuItem, menuItems*/ 18) {
    				toggle_class(button, "active", /*activeMenuItem*/ ctx[1] === /*item*/ ctx[13].id);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(84:6) {#each menuItems as item}",
    		ctx
    	});

    	return block;
    }

    // (119:8) {#each filteredSourceItems as item}
    function create_each_block$3(ctx) {
    	let button;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div1;
    	let span;
    	let t1_value = /*item*/ ctx[13].label + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[9](/*item*/ ctx[13]);
    	}

    	function dragstart_handler(...args) {
    		return /*dragstart_handler*/ ctx[10](/*item*/ ctx[13], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[13].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[13].preview);
    			attr_dev(img, "class", "thumbnail-img svelte-1l75b61");
    			add_location(img, file$5, 127, 14, 4115);
    			attr_dev(div0, "class", "thumbnail svelte-1l75b61");
    			add_location(div0, file$5, 126, 12, 4077);
    			attr_dev(span, "class", "label svelte-1l75b61");
    			add_location(span, file$5, 134, 14, 4318);
    			attr_dev(div1, "class", "item-info svelte-1l75b61");
    			add_location(div1, file$5, 133, 12, 4280);
    			attr_dev(button, "class", "source-item svelte-1l75b61");
    			attr_dev(button, "draggable", "true");
    			toggle_class(button, "active", /*activeSourceItem*/ ctx[2] === /*item*/ ctx[13].id);
    			add_location(button, file$5, 119, 10, 3813);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, div0);
    			append_dev(div0, img);
    			append_dev(button, t0);
    			append_dev(button, div1);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", click_handler_1, false, false, false, false),
    					listen_dev(button, "dragstart", dragstart_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*filteredSourceItems*/ 8 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[13].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*filteredSourceItems*/ 8 && img_alt_value !== (img_alt_value = /*item*/ ctx[13].preview)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*filteredSourceItems*/ 8 && t1_value !== (t1_value = /*item*/ ctx[13].label + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*activeSourceItem, filteredSourceItems*/ 12) {
    				toggle_class(button, "active", /*activeSourceItem*/ ctx[2] === /*item*/ ctx[13].id);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(119:8) {#each filteredSourceItems as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div7;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let nav;
    	let t1;
    	let div1;
    	let button0;
    	let span0;
    	let t3;
    	let button1;
    	let span1;
    	let t5;
    	let div6;
    	let h3;
    	let t7;
    	let div3;
    	let input;
    	let t8;
    	let div5;
    	let div4;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*menuItems*/ ctx[4];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*filteredSourceItems*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			nav = element("nav");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "◎";
    			t3 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "⮐";
    			t5 = space();
    			div6 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Source";
    			t7 = space();
    			div3 = element("div");
    			input = element("input");
    			t8 = space();
    			div5 = element("div");
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (!src_url_equal(img.src, img_src_value = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTj-AXmtU9GgjOJDLnODhTHuT7JjXBBQ-v6Mw&s")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Moktapi Tech");
    			attr_dev(img, "class", "svelte-1l75b61");
    			add_location(img, file$5, 79, 6, 2728);
    			attr_dev(div0, "class", "logo svelte-1l75b61");
    			add_location(div0, file$5, 78, 4, 2703);
    			attr_dev(nav, "class", "menu-items svelte-1l75b61");
    			add_location(nav, file$5, 82, 4, 2870);
    			attr_dev(span0, "class", "icon svelte-1l75b61");
    			add_location(span0, file$5, 96, 8, 3249);
    			attr_dev(button0, "class", "menu-item svelte-1l75b61");
    			add_location(button0, file$5, 95, 6, 3214);
    			attr_dev(span1, "class", "icon svelte-1l75b61");
    			add_location(span1, file$5, 99, 8, 3339);
    			attr_dev(button1, "class", "menu-item exit svelte-1l75b61");
    			add_location(button1, file$5, 98, 6, 3299);
    			attr_dev(div1, "class", "bottom-icons svelte-1l75b61");
    			add_location(div1, file$5, 94, 4, 3181);
    			attr_dev(div2, "class", "icon-menu svelte-1l75b61");
    			add_location(div2, file$5, 77, 2, 2675);
    			attr_dev(h3, "class", "section-title svelte-1l75b61");
    			add_location(h3, file$5, 106, 4, 3461);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Search sources...");
    			attr_dev(input, "class", "search-input svelte-1l75b61");
    			add_location(input, file$5, 108, 6, 3540);
    			attr_dev(div3, "class", "search-container svelte-1l75b61");
    			add_location(div3, file$5, 107, 4, 3503);
    			attr_dev(div4, "class", "source-items svelte-1l75b61");
    			add_location(div4, file$5, 117, 6, 3732);
    			attr_dev(div5, "class", "source-section svelte-1l75b61");
    			add_location(div5, file$5, 116, 4, 3697);
    			attr_dev(div6, "class", "source-panel svelte-1l75b61");
    			add_location(div6, file$5, 105, 2, 3430);
    			attr_dev(div7, "class", "layout svelte-1l75b61");
    			add_location(div7, file$5, 75, 0, 2626);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, nav);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(nav, null);
    				}
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, span0);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			append_dev(button1, span1);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, h3);
    			append_dev(div6, t7);
    			append_dev(div6, div3);
    			append_dev(div3, input);
    			set_input_value(input, /*searchQuery*/ ctx[0]);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div5, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div4, null);
    				}
    			}

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[8]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeMenuItem, menuItems, handleMenuClick*/ 50) {
    				each_value_1 = /*menuItems*/ ctx[4];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(nav, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*searchQuery*/ 1 && input.value !== /*searchQuery*/ ctx[0]) {
    				set_input_value(input, /*searchQuery*/ ctx[0]);
    			}

    			if (dirty & /*activeSourceItem, filteredSourceItems, handleSourceClick, handleDragStart*/ 76) {
    				each_value = /*filteredSourceItems*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
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
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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

    function handleDragStart(e, item) {
    	e.dataTransfer.setData('sourceType', item.id);
    	e.dataTransfer.setData('sourceId', item.id);
    	e.dataTransfer.effectAllowed = 'copy';
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let filteredSourceItems;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);
    	const dispatch = createEventDispatcher();

    	// Active menu item tracking
    	let activeMenuItem = 'display';

    	let activeSourceItem = 'camera';
    	let searchQuery = '';

    	const menuItems = [
    		{ id: 'home', icon: '⌂', label: 'Home' },
    		{
    			id: 'display',
    			icon: '▤',
    			label: 'Display'
    		},
    		{
    			id: 'monitor',
    			icon: '⚏',
    			label: 'Monitor'
    		},
    		{ id: 'camera', icon: '◨', label: 'Camera' },
    		{ id: 'light', icon: '◈', label: 'Light' },
    		{
    			id: 'settings',
    			icon: '⚡',
    			label: 'Settings'
    		}
    	];

    	const sourceItems = [
    		{
    			id: 'camera',
    			label: 'Camera',
    			thumbnail: 'https://cdn.prod.website-files.com/61120cb2509e012d40f0b214/66ab37833d8f95c6d57341c2_66ab3698545fb12226f9da2c_How%2520to%2520Share%2520Sound%2520on%2520Zoom%2520Meetings.png',
    			preview: 'A conference room with people seated around a table'
    		},
    		{
    			id: 'presentation',
    			label: 'Thank You!',
    			thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPKy78AHsIfSkQV_mPCPN-9uLh6l2pORZPYw&s',
    			preview: 'A dark presentation slide with Thank You! text'
    		},
    		{
    			id: 'conference',
    			label: 'Conference',
    			thumbnail: 'https://cdn.prod.website-files.com/61120cb2509e012d40f0b214/66ab37833d8f95c6d57341c2_66ab3698545fb12226f9da2c_How%2520to%2520Share%2520Sound%2520on%2520Zoom%2520Meetings.png',
    			preview: 'A grid of video call participants'
    		},
    		{
    			id: 'sharepoint',
    			label: 'Sharepoint',
    			thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp8eSku8I6BZwOeEi96c3B0-xTKHdZkCAibXHvvlLulP6moTfpShogHEpMhXr24LH0AsA&usqp=CAU',
    			preview: 'A Sharepoint interface with files and folders'
    		},
    		{
    			id: 'dashboard',
    			label: 'Dashboard',
    			thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-idC4P_Is8-bn1i3nWJL-yJeTvT4zA1ibAw&s',
    			preview: 'A dashboard with graphs and charts'
    		}
    	];

    	function handleMenuClick(id) {
    		$$invalidate(1, activeMenuItem = id);
    		dispatch('menuSelect', { id });
    	}

    	function handleSourceClick(id) {
    		$$invalidate(2, activeSourceItem = id);
    		dispatch('sourceSelect', { id });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = item => handleMenuClick(item.id);

    	function input_input_handler() {
    		searchQuery = this.value;
    		$$invalidate(0, searchQuery);
    	}

    	const click_handler_1 = item => handleSourceClick(item.id);
    	const dragstart_handler = (item, e) => handleDragStart(e, item);

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		activeMenuItem,
    		activeSourceItem,
    		searchQuery,
    		menuItems,
    		sourceItems,
    		handleMenuClick,
    		handleSourceClick,
    		handleDragStart,
    		filteredSourceItems
    	});

    	$$self.$inject_state = $$props => {
    		if ('activeMenuItem' in $$props) $$invalidate(1, activeMenuItem = $$props.activeMenuItem);
    		if ('activeSourceItem' in $$props) $$invalidate(2, activeSourceItem = $$props.activeSourceItem);
    		if ('searchQuery' in $$props) $$invalidate(0, searchQuery = $$props.searchQuery);
    		if ('filteredSourceItems' in $$props) $$invalidate(3, filteredSourceItems = $$props.filteredSourceItems);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchQuery*/ 1) {
    			$$invalidate(3, filteredSourceItems = searchQuery
    			? sourceItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()) || item.preview.toLowerCase().includes(searchQuery.toLowerCase()))
    			: sourceItems);
    		}
    	};

    	return [
    		searchQuery,
    		activeMenuItem,
    		activeSourceItem,
    		filteredSourceItems,
    		menuItems,
    		handleMenuClick,
    		handleSourceClick,
    		click_handler,
    		input_input_handler,
    		click_handler_1,
    		dragstart_handler
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut, axis = 'y' } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const primary_property = axis === 'y' ? 'height' : 'width';
        const primary_property_value = parseFloat(style[primary_property]);
        const secondary_properties = axis === 'y' ? ['top', 'bottom'] : ['left', 'right'];
        const capitalized_secondary_properties = secondary_properties.map((e) => `${e[0].toUpperCase()}${e.slice(1)}`);
        const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`]);
        const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`]);
        const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`]);
        const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`]);
        const border_width_start_value = parseFloat(style[`border${capitalized_secondary_properties[0]}Width`]);
        const border_width_end_value = parseFloat(style[`border${capitalized_secondary_properties[1]}Width`]);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `${primary_property}: ${t * primary_property_value}px;` +
                `padding-${secondary_properties[0]}: ${t * padding_start_value}px;` +
                `padding-${secondary_properties[1]}: ${t * padding_end_value}px;` +
                `margin-${secondary_properties[0]}: ${t * margin_start_value}px;` +
                `margin-${secondary_properties[1]}: ${t * margin_end_value}px;` +
                `border-${secondary_properties[0]}-width: ${t * border_width_start_value}px;` +
                `border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;`
        };
    }

    /* src\components\RightMenu.svelte generated by Svelte v3.59.2 */

    const { console: console_1$3, window: window_1 } = globals;
    const file$4 = "src\\components\\RightMenu.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    // (393:2) {#if isVideoOn && videoStream}
    function create_if_block_1$2(ctx) {
    	let div;
    	let video;

    	const block = {
    		c: function create() {
    			div = element("div");
    			video = element("video");
    			attr_dev(video, "id", "camera-feed");
    			video.autoplay = true;
    			video.playsInline = true;
    			video.muted = true;
    			attr_dev(video, "class", "camera-feed svelte-y5risy");
    			add_location(video, file$4, 394, 6, 13353);
    			attr_dev(div, "class", "camera-feed-container svelte-y5risy");
    			add_location(div, file$4, 393, 4, 13310);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, video);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(393:2) {#if isVideoOn && videoStream}",
    		ctx
    	});

    	return block;
    }

    // (419:8) {#if item.id === 'speaker' && showVolumeSlider}
    function create_if_block$2(ctx) {
    	let div;
    	let input;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "100");
    			attr_dev(input, "class", "svelte-y5risy");
    			add_location(input, file$4, 422, 12, 14125);
    			attr_dev(div, "class", "volume-slider svelte-y5risy");
    			add_location(div, file$4, 419, 10, 14015);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*volume*/ ctx[2]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[14]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[14]),
    					listen_dev(input, "input", /*handleVolumeChange*/ ctx[6], false, false, false, false),
    					listen_dev(div, "click", stop_propagation(/*click_handler*/ ctx[12]), false, false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*volume*/ 4) {
    				set_input_value(input, /*volume*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(419:8) {#if item.id === 'speaker' && showVolumeSlider}",
    		ctx
    	});

    	return block;
    }

    // (406:4) {#each menuItems as item}
    function create_each_block$2(ctx) {
    	let div;
    	let button;
    	let span;
    	let raw_value = /*item*/ ctx[29].icon(/*activeStates*/ ctx[4][/*item*/ ctx[29].id]) + "";
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[13](/*item*/ ctx[29]);
    	}

    	let if_block = /*item*/ ctx[29].id === 'speaker' && /*showVolumeSlider*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			span = element("span");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			attr_dev(span, "class", "icon svelte-y5risy");
    			add_location(span, file$4, 413, 10, 13825);
    			attr_dev(button, "class", "menu-item svelte-y5risy");
    			toggle_class(button, "active", /*activeStates*/ ctx[4][/*item*/ ctx[29].id]);
    			toggle_class(button, "record", /*item*/ ctx[29].id === 'record');
    			add_location(button, file$4, 407, 8, 13621);
    			attr_dev(div, "class", "menu-item-container svelte-y5risy");
    			add_location(div, file$4, 406, 6, 13578);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, span);
    			span.innerHTML = raw_value;
    			append_dev(div, t0);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*activeStates*/ 16) && raw_value !== (raw_value = /*item*/ ctx[29].icon(/*activeStates*/ ctx[4][/*item*/ ctx[29].id]) + "")) span.innerHTML = raw_value;
    			if (!current || dirty[0] & /*activeStates, menuItems*/ 48) {
    				toggle_class(button, "active", /*activeStates*/ ctx[4][/*item*/ ctx[29].id]);
    			}

    			if (/*item*/ ctx[29].id === 'speaker' && /*showVolumeSlider*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*showVolumeSlider*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t1);
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
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(406:4) {#each menuItems as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let t0;
    	let nav;
    	let t1;
    	let div0;
    	let button;
    	let span;
    	let raw_value = /*menuItems*/ ctx[5][/*menuItems*/ ctx[5].length - 1].icon() + "";
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*isVideoOn*/ ctx[0] && /*videoStream*/ ctx[3] && create_if_block_1$2(ctx);
    	let each_value = /*menuItems*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			nav = element("nav");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div0 = element("div");
    			button = element("button");
    			span = element("span");
    			attr_dev(nav, "class", "menu-items svelte-y5risy");
    			add_location(nav, file$4, 404, 2, 13515);
    			attr_dev(span, "class", "icon svelte-y5risy");
    			add_location(span, file$4, 437, 6, 14515);
    			attr_dev(button, "class", "menu-item svelte-y5risy");
    			add_location(button, file$4, 436, 4, 14415);
    			attr_dev(div0, "class", "bottom-icons svelte-y5risy");
    			add_location(div0, file$4, 435, 2, 14383);
    			attr_dev(div1, "class", "right-menu svelte-y5risy");
    			add_location(div1, file$4, 391, 0, 13246);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, nav);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(nav, null);
    				}
    			}

    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(button, span);
    			span.innerHTML = raw_value;
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "click", /*handleClickOutside*/ ctx[7], false, false, false, false),
    					listen_dev(button, "click", /*click_handler_2*/ ctx[15], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*isVideoOn*/ ctx[0] && /*videoStream*/ ctx[3]) {
    				if (if_block) ; else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(div1, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*volume, handleVolumeChange, menuItems, showVolumeSlider, activeStates*/ 118) {
    				each_value = /*menuItems*/ ctx[5];
    				validate_each_argument(each_value);
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
    						each_blocks[i].m(nav, null);
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
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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

    function stopStream(stream) {
    	if (stream) {
    		stream.getTracks().forEach(track => track.stop());
    	}
    }

    function handleMenuClick(item) {
    	item.action();
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let activeStates;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RightMenu', slots, []);
    	const dispatch = createEventDispatcher();

    	// State management
    	let activeMenuItem = 'mic';

    	let isMicOn = true;
    	let isSpeakerOn = true;
    	let isVideoOn = true;
    	let isScreenSharing = false;
    	let isRecording = false;
    	let showVolumeSlider = false;
    	let volume = 75;

    	// Media stream management
    	let micStream = null;

    	let videoStream = null;
    	let screenStream = null;
    	let mediaRecorder = null;
    	let recordedChunks = [];

    	// Device permissions state
    	let hasMicPermission = false;

    	let hasVideoPermission = false;

    	// Initialize volume slider gradient and check permissions
    	onMount(async () => {
    		const slider = document.querySelector('input[type="range"]');

    		if (slider) {
    			slider.style.setProperty('--volume-percent', `${volume}%`);
    		}

    		// Check initial permissions
    		try {
    			const permissions = await navigator.permissions.query({ name: 'microphone' });
    			hasMicPermission = permissions.state === 'granted';
    		} catch(e) {
    			console.log('Microphone permission check failed:', e);
    		}

    		try {
    			const permissions = await navigator.permissions.query({ name: 'camera' });
    			hasVideoPermission = permissions.state === 'granted';
    		} catch(e) {
    			console.log('Camera permission check failed:', e);
    		}
    	});

    	// Cleanup on component destroy
    	onDestroy(() => {
    		stopStream(micStream);
    		stopStream(videoStream);
    		stopStream(screenStream);

    		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    			mediaRecorder.stop();
    		}
    	});

    	async function startMicrophone() {
    		try {
    			if (micStream) {
    				stopStream(micStream);
    			}

    			micStream = await navigator.mediaDevices.getUserMedia({
    				audio: {
    					echoCancellation: true,
    					noiseSuppression: true,
    					autoGainControl: true
    				}
    			});

    			hasMicPermission = true;
    			return true;
    		} catch(e) {
    			console.log('Microphone start failed:', e);
    			hasMicPermission = false;
    			return false;
    		}
    	}

    	async function startCamera() {
    		try {
    			if (videoStream) {
    				stopStream(videoStream);
    			}

    			$$invalidate(3, videoStream = await navigator.mediaDevices.getUserMedia({
    				video: {
    					width: { ideal: 1280 },
    					height: { ideal: 720 },
    					facingMode: "user"
    				}
    			}));

    			hasVideoPermission = true;

    			// Update video element with stream
    			const videoElement = document.getElementById('camera-feed');

    			if (videoElement) {
    				videoElement.srcObject = videoStream;
    				videoElement.play();
    			}

    			return true;
    		} catch(e) {
    			console.log('Camera start failed:', e);
    			hasVideoPermission = false;
    			return false;
    		}
    	}

    	async function startScreenRecording() {
    		try {
    			// Get screen stream
    			screenStream = await navigator.mediaDevices.getDisplayMedia({
    				video: {
    					mediaSource: 'screen',
    					width: { ideal: 1920 },
    					height: { ideal: 1080 }
    				},
    				audio: true
    			});

    			// Create MediaRecorder
    			mediaRecorder = new MediaRecorder(screenStream,
    			{
    					mimeType: 'video/webm;codecs=vp9',
    					videoBitsPerSecond: 2500000
    				});

    			// Handle data available
    			mediaRecorder.ondataavailable = event => {
    				if (event.data.size > 0) {
    					recordedChunks.push(event.data);
    				}
    			};

    			// Handle recording stop
    			mediaRecorder.onstop = () => {
    				const blob = new Blob(recordedChunks, { type: 'video/webm' });
    				const url = URL.createObjectURL(blob);

    				// Create download link
    				const a = document.createElement('a');

    				a.style.display = 'none';
    				a.href = url;
    				a.download = `recording-${new Date().toISOString()}.webm`;
    				document.body.appendChild(a);
    				a.click();

    				// Cleanup
    				setTimeout(
    					() => {
    						document.body.removeChild(a);
    						window.URL.revokeObjectURL(url);
    					},
    					100
    				);

    				// Reset recording state and dispatch events
    				recordedChunks = [];

    				stopStream(screenStream);
    				screenStream = null;
    				mediaRecorder = null;
    				$$invalidate(11, isRecording = false);
    				dispatch('recordingToggle', { isRecording });

    				// Dispatch recording stopped event
    				window.dispatchEvent(new Event('recordingStopped'));
    			};

    			// Start recording
    			mediaRecorder.start();

    			// Dispatch recording started event
    			window.dispatchEvent(new Event('recordingStarted'));

    			return true;
    		} catch(e) {
    			console.error('Screen recording failed:', e);
    			return false;
    		}
    	}

    	function stopScreenRecording() {
    		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    			mediaRecorder.stop();
    		}
    	}

    	async function toggleRecording() {
    		$$invalidate(11, isRecording = !isRecording);
    		dispatch('recordingToggle', { isRecording });

    		if (isRecording) {
    			const success = await startScreenRecording();

    			if (!success) {
    				$$invalidate(11, isRecording = false);
    				dispatch('recordingToggle', { isRecording });
    				dispatch('error', { message: 'Failed to start recording' });
    			}
    		} else {
    			stopScreenRecording();
    		}
    	}

    	const menuItems = [
    		{
    			id: 'mic',
    			icon: active => `<svg viewBox="0 0 24 24" fill="currentColor">
        ${active
			? `<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
           <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>`
			: `<path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`}
      </svg>`,
    			label: 'Microphone',
    			action: async () => {
    				try {
    					if (!isMicOn) {
    						const success = await startMicrophone();

    						if (!success) {
    							dispatch('error', { message: 'Failed to start microphone' });
    							return;
    						}
    					} else {
    						stopStream(micStream);
    						micStream = null;
    					}

    					$$invalidate(8, isMicOn = !isMicOn);

    					dispatch('micToggle', {
    						active: isMicOn,
    						action: isMicOn ? 'unmute' : 'mute',
    						stream: isMicOn ? micStream : null
    					});
    				} catch(e) {
    					console.error('Microphone toggle failed:', e);
    					dispatch('error', { message: 'Failed to toggle microphone' });
    				}
    			}
    		},
    		{
    			id: 'speaker',
    			icon: active => {
    				if (!active) return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>`;

    				if (volume === 0) return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
        </svg>`;

    				if (volume < 33) return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 9v6h4l5 5V4l-5 5H7zm8 .83v4.34c.31-.14.59-.31.86-.49v-3.36c-.27-.18-.55-.35-.86-.49z"/>
        </svg>`;

    				if (volume < 66) return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 9v6h4l5 5V4l-5 5H7zm8 .83v4.34c.31-.14.59-.31.86-.49v-3.36c-.27-.18-.55-.35-.86-.49z M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>`;

    				return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>`;
    			},
    			label: 'Speaker',
    			action: () => {
    				if (showVolumeSlider) {
    					$$invalidate(9, isSpeakerOn = !isSpeakerOn);
    					dispatch('speakerToggle', { active: isSpeakerOn });
    				}

    				$$invalidate(1, showVolumeSlider = !showVolumeSlider);
    			}
    		},
    		{
    			id: 'video',
    			icon: active => `<svg viewBox="0 0 24 24" fill="currentColor">
        ${active
			? `<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>`
			: `<path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>`}
      </svg>`,
    			label: 'Video',
    			action: async () => {
    				try {
    					if (!isVideoOn) {
    						const success = await startCamera();

    						if (!success) {
    							dispatch('error', { message: 'Failed to start camera' });
    							return;
    						}
    					} else {
    						stopStream(videoStream);
    						$$invalidate(3, videoStream = null);
    					}

    					$$invalidate(0, isVideoOn = !isVideoOn);

    					dispatch('videoToggle', {
    						active: isVideoOn,
    						action: isVideoOn ? 'startVideo' : 'stopVideo',
    						stream: isVideoOn ? videoStream : null
    					});
    				} catch(e) {
    					console.error('Camera toggle failed:', e);
    					dispatch('error', { message: 'Failed to toggle camera' });
    				}
    			}
    		},
    		{
    			id: 'screen',
    			icon: active => `<svg viewBox="0 0 24 24" fill="currentColor">
        ${active
			? `<path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>`
			: `<path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zm-7-3.53v-2.19c-2.78 0-4.61.85-6 2.72.56-2.67 2.11-5.33 6-5.87V7l4 3.73-4 3.74z"/>`}
      </svg>`,
    			label: 'Screen Share',
    			action: async () => {
    				try {
    					if (!isScreenSharing) {
    						await navigator.mediaDevices.getDisplayMedia({ video: true });
    						$$invalidate(10, isScreenSharing = true);
    						dispatch('screenShare', { active: true, action: 'startSharing' });
    					} else {
    						dispatch('screenShare', { active: false, action: 'stopSharing' });
    						$$invalidate(10, isScreenSharing = false);
    					}
    				} catch(e) {
    					console.log('Screen sharing error:', e);

    					dispatch('error', {
    						message: 'Screen sharing failed or was denied'
    					});

    					$$invalidate(10, isScreenSharing = false);
    				}
    			}
    		},
    		{
    			id: 'record',
    			icon: active => `<svg viewBox="0 0 24 24" fill="currentColor">
        ${active
			? `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>`
			: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3.5l6-4.5-6-4.5v9z"/>`}
      </svg>`,
    			label: 'Record',
    			action: toggleRecording
    		},
    		{
    			id: 'share',
    			icon: () => `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 8h-3v2h3v11H6V10h3V8H6c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6-5v9.5l3.5-3.5 1.4 1.4L12 15.3l-4.9-4.9 1.4-1.4L12 12.5V3h2z"/>
      </svg>`,
    			label: 'Share',
    			action: () => {
    				dispatch('share');
    			}
    		}
    	];

    	function handleVolumeChange(event) {
    		$$invalidate(2, volume = event.target.value);
    		const slider = event.target;
    		slider.style.setProperty('--volume-percent', `${volume}%`);
    		dispatch('volumeChange', { volume: parseInt(volume) });
    	}

    	// Add click handler for closing volume slider when clicking outside
    	function handleClickOutside(event) {
    		if (showVolumeSlider && !event.target.closest('.menu-item-container')) {
    			$$invalidate(1, showVolumeSlider = false);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<RightMenu> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = item => handleMenuClick(item);

    	function input_change_input_handler() {
    		volume = to_number(this.value);
    		$$invalidate(2, volume);
    	}

    	const click_handler_2 = () => handleMenuClick(menuItems[menuItems.length - 1]);

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		onDestroy,
    		slide,
    		dispatch,
    		activeMenuItem,
    		isMicOn,
    		isSpeakerOn,
    		isVideoOn,
    		isScreenSharing,
    		isRecording,
    		showVolumeSlider,
    		volume,
    		micStream,
    		videoStream,
    		screenStream,
    		mediaRecorder,
    		recordedChunks,
    		hasMicPermission,
    		hasVideoPermission,
    		stopStream,
    		startMicrophone,
    		startCamera,
    		startScreenRecording,
    		stopScreenRecording,
    		toggleRecording,
    		menuItems,
    		handleMenuClick,
    		handleVolumeChange,
    		handleClickOutside,
    		activeStates
    	});

    	$$self.$inject_state = $$props => {
    		if ('activeMenuItem' in $$props) activeMenuItem = $$props.activeMenuItem;
    		if ('isMicOn' in $$props) $$invalidate(8, isMicOn = $$props.isMicOn);
    		if ('isSpeakerOn' in $$props) $$invalidate(9, isSpeakerOn = $$props.isSpeakerOn);
    		if ('isVideoOn' in $$props) $$invalidate(0, isVideoOn = $$props.isVideoOn);
    		if ('isScreenSharing' in $$props) $$invalidate(10, isScreenSharing = $$props.isScreenSharing);
    		if ('isRecording' in $$props) $$invalidate(11, isRecording = $$props.isRecording);
    		if ('showVolumeSlider' in $$props) $$invalidate(1, showVolumeSlider = $$props.showVolumeSlider);
    		if ('volume' in $$props) $$invalidate(2, volume = $$props.volume);
    		if ('micStream' in $$props) micStream = $$props.micStream;
    		if ('videoStream' in $$props) $$invalidate(3, videoStream = $$props.videoStream);
    		if ('screenStream' in $$props) screenStream = $$props.screenStream;
    		if ('mediaRecorder' in $$props) mediaRecorder = $$props.mediaRecorder;
    		if ('recordedChunks' in $$props) recordedChunks = $$props.recordedChunks;
    		if ('hasMicPermission' in $$props) hasMicPermission = $$props.hasMicPermission;
    		if ('hasVideoPermission' in $$props) hasVideoPermission = $$props.hasVideoPermission;
    		if ('activeStates' in $$props) $$invalidate(4, activeStates = $$props.activeStates);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*isMicOn, isSpeakerOn, isVideoOn, isScreenSharing, isRecording*/ 3841) {
    			$$invalidate(4, activeStates = {
    				mic: isMicOn,
    				speaker: isSpeakerOn,
    				video: isVideoOn,
    				screen: isScreenSharing,
    				record: isRecording
    			});
    		}
    	};

    	return [
    		isVideoOn,
    		showVolumeSlider,
    		volume,
    		videoStream,
    		activeStates,
    		menuItems,
    		handleVolumeChange,
    		handleClickOutside,
    		isMicOn,
    		isSpeakerOn,
    		isScreenSharing,
    		isRecording,
    		click_handler,
    		click_handler_1,
    		input_change_input_handler,
    		click_handler_2
    	];
    }

    class RightMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RightMenu",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Header.svelte generated by Svelte v3.59.2 */
    const file$3 = "src\\components\\Header.svelte";

    function create_fragment$3(ctx) {
    	let div4;
    	let div0;
    	let h2;
    	let t1;
    	let div3;
    	let div1;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let div2;
    	let t5;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Displays";
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Rec";
    			t4 = space();
    			div2 = element("div");
    			t5 = text(/*time*/ ctx[1]);
    			attr_dev(h2, "class", "svelte-uoksd2");
    			add_location(h2, file$3, 56, 4, 1229);
    			attr_dev(div0, "class", "left svelte-uoksd2");
    			add_location(div0, file$3, 55, 2, 1205);
    			attr_dev(span0, "class", "rec-dot svelte-uoksd2");
    			toggle_class(span0, "active", /*isRecording*/ ctx[0]);
    			add_location(span0, file$3, 60, 6, 1323);
    			add_location(span1, file$3, 61, 6, 1387);
    			attr_dev(div1, "class", "recording-status svelte-uoksd2");
    			add_location(div1, file$3, 59, 4, 1285);
    			attr_dev(div2, "class", "timer svelte-uoksd2");
    			add_location(div2, file$3, 63, 4, 1421);
    			attr_dev(div3, "class", "right svelte-uoksd2");
    			add_location(div3, file$3, 58, 2, 1260);
    			attr_dev(div4, "class", "header svelte-uoksd2");
    			add_location(div4, file$3, 54, 0, 1181);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, h2);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isRecording*/ 1) {
    				toggle_class(span0, "active", /*isRecording*/ ctx[0]);
    			}

    			if (dirty & /*time*/ 2) set_data_dev(t5, /*time*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
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

    function formatTime(num) {
    	return num.toString().padStart(2, '0');
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let time;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	let seconds = 0;
    	let minutes = 0;
    	let timerInterval;
    	let { isRecording = false } = $$props;

    	// Listen for recording events
    	window.addEventListener('recordingStarted', () => {
    		startTimer();
    	});

    	window.addEventListener('recordingStopped', () => {
    		stopTimer();
    	});

    	function startTimer() {
    		if (!timerInterval) {
    			timerInterval = setInterval(
    				() => {
    					$$invalidate(2, seconds += 1);

    					if (seconds >= 60) {
    						$$invalidate(3, minutes += 1);
    						$$invalidate(2, seconds = 0);
    					}
    				},
    				1000
    			);
    		}
    	}

    	function stopTimer() {
    		if (timerInterval) {
    			clearInterval(timerInterval);
    			timerInterval = null;
    			$$invalidate(2, seconds = 0);
    			$$invalidate(3, minutes = 0);
    		}
    	}

    	onDestroy(() => {
    		if (timerInterval) {
    			clearInterval(timerInterval);
    		}

    		// Clean up event listeners
    		window.removeEventListener('recordingStarted', startTimer);

    		window.removeEventListener('recordingStopped', stopTimer);
    	});

    	const writable_props = ['isRecording'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('isRecording' in $$props) $$invalidate(0, isRecording = $$props.isRecording);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		seconds,
    		minutes,
    		timerInterval,
    		isRecording,
    		formatTime,
    		startTimer,
    		stopTimer,
    		time
    	});

    	$$self.$inject_state = $$props => {
    		if ('seconds' in $$props) $$invalidate(2, seconds = $$props.seconds);
    		if ('minutes' in $$props) $$invalidate(3, minutes = $$props.minutes);
    		if ('timerInterval' in $$props) timerInterval = $$props.timerInterval;
    		if ('isRecording' in $$props) $$invalidate(0, isRecording = $$props.isRecording);
    		if ('time' in $$props) $$invalidate(1, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*minutes, seconds*/ 12) {
    			$$invalidate(1, time = `${formatTime(minutes)}:${formatTime(seconds)}`);
    		}
    	};

    	return [isRecording, time, seconds, minutes];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { isRecording: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get isRecording() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRecording(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\VideoWall.svelte generated by Svelte v3.59.2 */

    const { console: console_1$2 } = globals;
    const file$2 = "src\\components\\VideoWall.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[8] = list;
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (171:47) 
    function create_if_block_5(ctx) {
    	let div;

    	function select_block_type_1(ctx, dirty) {
    		if (/*item*/ ctx[7].content?.type === 'document') return create_if_block_6;
    		if (/*item*/ ctx[7].content?.type === 'folder') return create_if_block_11;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "sharepoint-item svelte-1ccwwa5");
    			add_location(div, file$2, 171, 12, 5979);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(171:47) ",
    		ctx
    	});

    	return block;
    }

    // (167:46) 
    function create_if_block_4(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[7].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Analytics Dashboard");
    			attr_dev(img, "class", "svelte-1ccwwa5");
    			add_location(img, file$2, 168, 14, 5842);
    			attr_dev(div, "class", "dashboard svelte-1ccwwa5");
    			add_location(div, file$2, 167, 12, 5803);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videoWallItems*/ 1 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[7].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(167:46) ",
    		ctx
    	});

    	return block;
    }

    // (159:47) 
    function create_if_block_3(ctx) {
    	let div1;
    	let div0;
    	let each_value_1 = Array(/*item*/ ctx[7].content.participants);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "participants-grid svelte-1ccwwa5");
    			add_location(div0, file$2, 160, 14, 5521);
    			attr_dev(div1, "class", "conference-grid svelte-1ccwwa5");
    			add_location(div1, file$2, 159, 12, 5476);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videoWallItems*/ 1) {
    				each_value_1 = Array(/*item*/ ctx[7].content.participants);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(159:47) ",
    		ctx
    	});

    	return block;
    }

    // (152:49) 
    function create_if_block_2(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t0_value = /*item*/ ctx[7].content.title + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = /*item*/ ctx[7].content.subtitle + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			attr_dev(h1, "class", "svelte-1ccwwa5");
    			add_location(h1, file$2, 154, 16, 5273);
    			attr_dev(p, "class", "contact-info svelte-1ccwwa5");
    			add_location(p, file$2, 155, 16, 5320);
    			attr_dev(div0, "class", "thank-you-slide svelte-1ccwwa5");
    			add_location(div0, file$2, 153, 14, 5226);
    			attr_dev(div1, "class", "presentation svelte-1ccwwa5");
    			add_location(div1, file$2, 152, 12, 5184);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videoWallItems*/ 1 && t0_value !== (t0_value = /*item*/ ctx[7].content.title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*videoWallItems*/ 1 && t2_value !== (t2_value = /*item*/ ctx[7].content.subtitle + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(152:49) ",
    		ctx
    	});

    	return block;
    }

    // (139:10) {#if item.type === 'camera' || item.type === 'screen'}
    function create_if_block$1(ctx) {
    	let video;
    	let each_value = /*each_value*/ ctx[8];
    	let item_index = /*item_index*/ ctx[9];
    	let handleVideoRef_action;
    	let t;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	const assign_video = () => /*video_binding*/ ctx[4](video, each_value, item_index);
    	const unassign_video = () => /*video_binding*/ ctx[4](null, each_value, item_index);
    	let if_block = /*item*/ ctx[7].type === 'screen' && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			video = element("video");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			video.autoplay = true;
    			video.playsInline = true;
    			video.muted = true;
    			attr_dev(video, "class", "svelte-1ccwwa5");
    			add_location(video, file$2, 139, 12, 4726);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, video, anchor);
    			assign_video();
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(handleVideoRef_action = handleVideoRef.call(null, video, /*item*/ ctx[7]));
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (each_value !== /*each_value*/ ctx[8] || item_index !== /*item_index*/ ctx[9]) {
    				unassign_video();
    				each_value = /*each_value*/ ctx[8];
    				item_index = /*item_index*/ ctx[9];
    				assign_video();
    			}

    			if (handleVideoRef_action && is_function(handleVideoRef_action.update) && dirty & /*videoWallItems*/ 1) handleVideoRef_action.update.call(null, /*item*/ ctx[7]);

    			if (/*item*/ ctx[7].type === 'screen') {
    				if (if_block) ; else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(video);
    			unassign_video();
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(139:10) {#if item.type === 'camera' || item.type === 'screen'}",
    		ctx
    	});

    	return block;
    }

    // (214:14) {:else}
    function create_else_block_1(ctx) {
    	let div2;
    	let div0;
    	let svg;
    	let path;
    	let t0;
    	let div1;
    	let h3;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Unknown Item";
    			t2 = space();
    			p = element("p");
    			p.textContent = "No details available";
    			attr_dev(path, "d", "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z");
    			add_location(path, file$2, 217, 22, 9196);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "48");
    			attr_dev(svg, "height", "48");
    			attr_dev(svg, "class", "svelte-1ccwwa5");
    			add_location(svg, file$2, 216, 20, 9104);
    			attr_dev(div0, "class", "document-icon svelte-1ccwwa5");
    			add_location(div0, file$2, 215, 18, 9055);
    			attr_dev(h3, "class", "svelte-1ccwwa5");
    			add_location(h3, file$2, 221, 20, 9457);
    			attr_dev(p, "class", "svelte-1ccwwa5");
    			add_location(p, file$2, 222, 20, 9500);
    			attr_dev(div1, "class", "document-info svelte-1ccwwa5");
    			add_location(div1, file$2, 220, 18, 9408);
    			attr_dev(div2, "class", "document-preview svelte-1ccwwa5");
    			add_location(div2, file$2, 214, 16, 9005);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(214:14) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:56) 
    function create_if_block_11(ctx) {
    	let div2;
    	let div0;
    	let svg;
    	let path;
    	let t0;
    	let div1;
    	let h3;
    	let t1_value = (/*item*/ ctx[7].content.name || 'Unknown Folder') + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = (/*item*/ ctx[7].content.itemCount || 0) + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = text(" items");
    			attr_dev(path, "d", "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z");
    			add_location(path, file$2, 205, 22, 8578);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "48");
    			attr_dev(svg, "height", "48");
    			add_location(svg, file$2, 204, 20, 8486);
    			attr_dev(div0, "class", "folder-icon svelte-1ccwwa5");
    			add_location(div0, file$2, 203, 18, 8439);
    			attr_dev(h3, "class", "svelte-1ccwwa5");
    			add_location(h3, file$2, 209, 20, 8802);
    			attr_dev(p, "class", "svelte-1ccwwa5");
    			add_location(p, file$2, 210, 20, 8872);
    			attr_dev(div1, "class", "folder-info svelte-1ccwwa5");
    			add_location(div1, file$2, 208, 18, 8755);
    			attr_dev(div2, "class", "folder-preview svelte-1ccwwa5");
    			add_location(div2, file$2, 202, 16, 8391);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videoWallItems*/ 1 && t1_value !== (t1_value = (/*item*/ ctx[7].content.name || 'Unknown Folder') + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*videoWallItems*/ 1 && t3_value !== (t3_value = (/*item*/ ctx[7].content.itemCount || 0) + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(202:56) ",
    		ctx
    	});

    	return block;
    }

    // (173:14) {#if item.content?.type === 'document'}
    function create_if_block_6(ctx) {
    	let div2;
    	let div0;
    	let show_if;
    	let show_if_1;
    	let show_if_2;
    	let t0;
    	let div1;
    	let h3;
    	let t1_value = (/*item*/ ctx[7].content.name || 'Unknown Document') + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = (/*item*/ ctx[7].content.modified || 'Unknown date') + "";
    	let t3;
    	let t4;

    	function select_block_type_2(ctx, dirty) {
    		if (dirty & /*videoWallItems*/ 1) show_if = null;
    		if (dirty & /*videoWallItems*/ 1) show_if_1 = null;
    		if (dirty & /*videoWallItems*/ 1) show_if_2 = null;
    		if (show_if == null) show_if = !!/*item*/ ctx[7].content.fileType?.includes('pdf');
    		if (show_if) return create_if_block_8;
    		if (show_if_1 == null) show_if_1 = !!(/*item*/ ctx[7].content.fileType?.includes('excel') || /*item*/ ctx[7].content.fileType?.includes('xlsx'));
    		if (show_if_1) return create_if_block_9;
    		if (show_if_2 == null) show_if_2 = !!(/*item*/ ctx[7].content.fileType?.includes('word') || /*item*/ ctx[7].content.fileType?.includes('docx'));
    		if (show_if_2) return create_if_block_10;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_2(ctx, -1);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*item*/ ctx[7].content.fileType && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "document-icon svelte-1ccwwa5");
    			add_location(div0, file$2, 174, 18, 6131);
    			attr_dev(h3, "class", "svelte-1ccwwa5");
    			add_location(h3, file$2, 194, 20, 7977);
    			attr_dev(p, "class", "svelte-1ccwwa5");
    			add_location(p, file$2, 195, 20, 8049);
    			attr_dev(div1, "class", "document-info svelte-1ccwwa5");
    			add_location(div1, file$2, 193, 18, 7928);
    			attr_dev(div2, "class", "document-preview svelte-1ccwwa5");
    			add_location(div2, file$2, 173, 16, 6081);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if_block0.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			append_dev(div1, t4);
    			if (if_block1) if_block1.m(div1, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_2(ctx, dirty))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (dirty & /*videoWallItems*/ 1 && t1_value !== (t1_value = (/*item*/ ctx[7].content.name || 'Unknown Document') + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*videoWallItems*/ 1 && t3_value !== (t3_value = (/*item*/ ctx[7].content.modified || 'Unknown date') + "")) set_data_dev(t3, t3_value);

    			if (/*item*/ ctx[7].content.fileType) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_7(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(173:14) {#if item.content?.type === 'document'}",
    		ctx
    	});

    	return block;
    }

    // (188:20) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z");
    			add_location(path, file$2, 189, 24, 7687);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "48");
    			attr_dev(svg, "height", "48");
    			attr_dev(svg, "class", "svelte-1ccwwa5");
    			add_location(svg, file$2, 188, 22, 7593);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(188:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (184:113) 
    function create_if_block_10(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 10H8v-2h8v2zm0-4H8V7h8v2z");
    			add_location(path, file$2, 185, 24, 7393);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "#2B579A");
    			attr_dev(svg, "width", "48");
    			attr_dev(svg, "height", "48");
    			attr_dev(svg, "class", "svelte-1ccwwa5");
    			add_location(svg, file$2, 184, 22, 7304);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(184:113) ",
    		ctx
    	});

    	return block;
    }

    // (180:114) 
    function create_if_block_9(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3.5 14H14v-2.5h-4V17H8.5v-2.5h4V12H14v2.5h1.5V17zm-6-9h1.5v1.5H13V7h1.5v1.5H16V10h-1.5v1.5H13V10h-1.5v1.5H10V10H8.5V8.5H10V7z");
    			add_location(path, file$2, 181, 24, 6920);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "#217346");
    			attr_dev(svg, "width", "48");
    			attr_dev(svg, "height", "48");
    			attr_dev(svg, "class", "svelte-1ccwwa5");
    			add_location(svg, file$2, 180, 22, 6831);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(180:114) ",
    		ctx
    	});

    	return block;
    }

    // (176:20) {#if item.content.fileType?.includes('pdf')}
    function create_if_block_8(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z");
    			add_location(path, file$2, 177, 24, 6342);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "48");
    			attr_dev(svg, "height", "48");
    			attr_dev(svg, "class", "svelte-1ccwwa5");
    			add_location(svg, file$2, 176, 22, 6248);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(176:20) {#if item.content.fileType?.includes('pdf')}",
    		ctx
    	});

    	return block;
    }

    // (197:20) {#if item.content.fileType}
    function create_if_block_7(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[7].content.fileType.toUpperCase() + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "file-type svelte-1ccwwa5");
    			add_location(span, file$2, 197, 22, 8170);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videoWallItems*/ 1 && t_value !== (t_value = /*item*/ ctx[7].content.fileType.toUpperCase() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(197:20) {#if item.content.fileType}",
    		ctx
    	});

    	return block;
    }

    // (162:16) {#each Array(item.content.participants) as _, i}
    function create_each_block_1$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "participant-cell svelte-1ccwwa5");
    			add_location(div, file$2, 162, 18, 5638);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(162:16) {#each Array(item.content.participants) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (147:12) {#if item.type === 'screen'}
    function create_if_block_1$1(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Screen Share";
    			attr_dev(span, "class", "screen-share-label svelte-1ccwwa5");
    			add_location(span, file$2, 148, 16, 5026);
    			attr_dev(div, "class", "screen-share-overlay svelte-1ccwwa5");
    			add_location(div, file$2, 147, 14, 4974);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(147:12) {#if item.type === 'screen'}",
    		ctx
    	});

    	return block;
    }

    // (137:6) {#each videoWallItems as item (item.id)}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[7].type === 'camera' || /*item*/ ctx[7].type === 'screen') return create_if_block$1;
    		if (/*item*/ ctx[7].type === 'presentation') return create_if_block_2;
    		if (/*item*/ ctx[7].type === 'conference') return create_if_block_3;
    		if (/*item*/ ctx[7].type === 'dashboard') return create_if_block_4;
    		if (/*item*/ ctx[7].type === 'sharepoint') return create_if_block_5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			attr_dev(div, "class", "video-item svelte-1ccwwa5");
    			add_location(div, file$2, 137, 8, 4622);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(137:6) {#each videoWallItems as item (item.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div6;
    	let div3;
    	let div1;
    	let div0;
    	let button0;
    	let svg0;
    	let path0;
    	let t0;
    	let button1;
    	let svg1;
    	let path1;
    	let t1;
    	let div2;
    	let span0;
    	let t3;
    	let span1;
    	let t5;
    	let div5;
    	let div4;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let each_value = /*videoWallItems*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[7].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t1 = space();
    			div2 = element("div");
    			span0 = element("span");
    			span0.textContent = "Video Wall";
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "Drag from sources";
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(path0, "d", "M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z");
    			add_location(path0, file$2, 118, 12, 3561);
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "width", "20");
    			attr_dev(svg0, "height", "20");
    			add_location(svg0, file$2, 117, 10, 3479);
    			attr_dev(button0, "class", "control-btn power-btn svelte-1ccwwa5");
    			add_location(button0, file$2, 116, 8, 3403);
    			attr_dev(path1, "d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z");
    			add_location(path1, file$2, 123, 12, 3989);
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "currentColor");
    			attr_dev(svg1, "width", "20");
    			attr_dev(svg1, "height", "20");
    			add_location(svg1, file$2, 122, 10, 3907);
    			attr_dev(button1, "class", "control-btn success-btn svelte-1ccwwa5");
    			add_location(button1, file$2, 121, 8, 3828);
    			attr_dev(div0, "class", "buttons svelte-1ccwwa5");
    			add_location(div0, file$2, 115, 6, 3372);
    			attr_dev(div1, "class", "left svelte-1ccwwa5");
    			add_location(div1, file$2, 114, 4, 3346);
    			attr_dev(span0, "class", "drag-text svelte-1ccwwa5");
    			add_location(span0, file$2, 129, 6, 4266);
    			attr_dev(span1, "class", "subtitle svelte-1ccwwa5");
    			add_location(span1, file$2, 130, 6, 4315);
    			attr_dev(div2, "class", "right svelte-1ccwwa5");
    			add_location(div2, file$2, 128, 4, 4239);
    			attr_dev(div3, "class", "header svelte-1ccwwa5");
    			add_location(div3, file$2, 113, 2, 3320);
    			attr_dev(div4, "class", "video-grid svelte-1ccwwa5");
    			set_style(div4, "--grid-columns", Math.ceil(Math.sqrt(/*videoWallItems*/ ctx[0].length)));
    			add_location(div4, file$2, 135, 4, 4470);
    			attr_dev(div5, "class", "video-wall svelte-1ccwwa5");
    			add_location(div5, file$2, 134, 2, 4390);
    			attr_dev(div6, "class", "video-wall-container svelte-1ccwwa5");
    			add_location(div6, file$2, 112, 0, 3282);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, span0);
    			append_dev(div2, t3);
    			append_dev(div2, span1);
    			append_dev(div6, t5);
    			append_dev(div6, div5);
    			append_dev(div5, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div4, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handleCloseAll*/ ctx[2], false, false, false, false),
    					listen_dev(button1, "click", /*handleSelectAll*/ ctx[1], false, false, false, false),
    					listen_dev(div5, "dragover", handleDragOver$1, false, false, false, false),
    					listen_dev(div5, "drop", /*handleDrop*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*videoWallItems, Array*/ 1) {
    				each_value = /*videoWallItems*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div4, destroy_block, create_each_block$1, null, get_each_context$1);
    			}

    			if (dirty & /*videoWallItems*/ 1) {
    				set_style(div4, "--grid-columns", Math.ceil(Math.sqrt(/*videoWallItems*/ ctx[0].length)));
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
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

    function handleDragOver$1(e) {
    	e.preventDefault();
    	e.dataTransfer.dropEffect = 'copy';
    }

    function handleVideoRef(element, item) {
    	if (element && item.stream) {
    		element.srcObject = item.stream;
    		element.play().catch(err => console.error('Failed to play video:', err));
    	}
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VideoWall', slots, []);
    	const dispatch = createEventDispatcher();

    	// Initial items that show when the application loads
    	let videoWallItems = [
    		{
    			id: 'presentation',
    			type: 'presentation',
    			stream: null,
    			videoElement: null,
    			thumbnail: '/thank-you-slide.jpg', // We'll need to ensure this image exists
    			content: {
    				title: 'Thank You!',
    				subtitle: '@company.name     www.company.com     (123) 456-7890'
    			}
    		}
    	];

    	let draggedItem = null;

    	// Add new functions for button actions
    	function handleSelectAll() {
    		dispatch('selectAll', { items: videoWallItems });
    	}

    	async function handleCloseAll() {
    		// Stop all video streams before removing (except presentation)
    		for (const item of videoWallItems) {
    			if (item.type !== 'presentation') {
    				// Skip presentation items
    				if (item.stream) {
    					item.stream.getTracks().forEach(track => track.stop());
    				}

    				if (item.videoElement) {
    					item.videoElement.srcObject = null;
    				}
    			}
    		}

    		// Keep only presentation items
    		$$invalidate(0, videoWallItems = videoWallItems.filter(item => item.type === 'presentation'));

    		dispatch('closeAll');
    	}

    	async function handleDrop(e) {
    		e.preventDefault();
    		const sourceType = e.dataTransfer.getData('sourceType');
    		const sourceId = e.dataTransfer.getData('sourceId');
    		console.log('Dropped item:', { sourceType, sourceId }); // Debug log

    		if (!videoWallItems.find(item => item.id === sourceId)) {
    			let stream = null;

    			if (sourceType === 'camera') {
    				try {
    					stream = await navigator.mediaDevices.getUserMedia({
    						video: {
    							width: { ideal: 1280 },
    							height: { ideal: 720 }
    						},
    						audio: true
    					});
    				} catch(err) {
    					console.error('Failed to get camera:', err);
    				}
    			} else if (sourceType === 'screen') {
    				try {
    					stream = await navigator.mediaDevices.getDisplayMedia({
    						video: { cursor: "always" },
    						audio: false
    					});

    					// Handle stream ending (user stops sharing)
    					stream.getVideoTracks()[0].onended = () => {
    						$$invalidate(0, videoWallItems = videoWallItems.filter(item => item.id !== sourceId));
    					};
    				} catch(err) {
    					console.error('Failed to start screen sharing:', err);
    				}
    			}

    			if (stream) {
    				const newItem = {
    					id: sourceId,
    					type: sourceType,
    					stream,
    					videoElement: null
    				};

    				console.log('Adding new item:', newItem); // Debug log
    				$$invalidate(0, videoWallItems = [...videoWallItems, newItem]);
    				dispatch('sourceAdded', { sourceId, sourceType });
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<VideoWall> was created with unknown prop '${key}'`);
    	});

    	function video_binding($$value, each_value, item_index) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			each_value[item_index].videoElement = $$value;
    			$$invalidate(0, videoWallItems);
    		});
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		videoWallItems,
    		draggedItem,
    		handleSelectAll,
    		handleCloseAll,
    		handleDragOver: handleDragOver$1,
    		handleDrop,
    		handleVideoRef
    	});

    	$$self.$inject_state = $$props => {
    		if ('videoWallItems' in $$props) $$invalidate(0, videoWallItems = $$props.videoWallItems);
    		if ('draggedItem' in $$props) draggedItem = $$props.draggedItem;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [videoWallItems, handleSelectAll, handleCloseAll, handleDrop, video_binding];
    }

    class VideoWall extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VideoWall",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\TableMonitor.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$1 = "src\\components\\TableMonitor.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (119:40) 
    function create_if_block_1(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let each_value_4 = /*item*/ ctx[5].content.data.values;
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "chart-line svelte-13uruo9");
    			add_location(div0, file$1, 122, 16, 3936);
    			attr_dev(div1, "class", "chart-placeholder svelte-13uruo9");
    			add_location(div1, file$1, 121, 14, 3887);
    			attr_dev(div2, "class", "chart-container svelte-13uruo9");
    			add_location(div2, file$1, 120, 12, 3842);
    			attr_dev(div3, "class", "chart-view svelte-13uruo9");
    			add_location(div3, file$1, 119, 10, 3804);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*monitorItems*/ 1) {
    				each_value_4 = /*item*/ ctx[5].content.data.values;
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(119:40) ",
    		ctx
    	});

    	return block;
    }

    // (98:8) {#if item.type === 'table'}
    function create_if_block(ctx) {
    	let div;
    	let table;
    	let thead;
    	let tr;
    	let t;
    	let tbody;
    	let each_value_3 = /*item*/ ctx[5].content.headers;
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_1 = /*item*/ ctx[5].content.rows;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(tr, file$1, 101, 16, 3255);
    			add_location(thead, file$1, 100, 14, 3230);
    			add_location(tbody, file$1, 107, 14, 3446);
    			attr_dev(table, "class", "svelte-13uruo9");
    			add_location(table, file$1, 99, 12, 3207);
    			attr_dev(div, "class", "table-view svelte-13uruo9");
    			add_location(div, file$1, 98, 10, 3169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(tr, null);
    				}
    			}

    			append_dev(table, t);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(tbody, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*monitorItems*/ 1) {
    				each_value_3 = /*item*/ ctx[5].content.headers;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty & /*monitorItems*/ 1) {
    				each_value_1 = /*item*/ ctx[5].content.rows;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
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
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(98:8) {#if item.type === 'table'}",
    		ctx
    	});

    	return block;
    }

    // (124:18) {#each item.content.data.values as value, i}
    function create_each_block_4(ctx) {
    	let div;
    	let span0;
    	let t0;
    	let span1;
    	let t1_value = /*item*/ ctx[5].content.data.labels[/*i*/ ctx[19]] + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span0, "class", "point svelte-13uruo9");
    			add_location(span0, file$1, 125, 22, 4121);
    			attr_dev(span1, "class", "label svelte-13uruo9");
    			add_location(span1, file$1, 126, 22, 4172);
    			attr_dev(div, "class", "chart-point svelte-13uruo9");
    			set_style(div, "--value", /*value*/ ctx[17] + "%");
    			add_location(div, file$1, 124, 20, 4046);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(span1, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*monitorItems*/ 1 && t1_value !== (t1_value = /*item*/ ctx[5].content.data.labels[/*i*/ ctx[19]] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*monitorItems*/ 1) {
    				set_style(div, "--value", /*value*/ ctx[17] + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(124:18) {#each item.content.data.values as value, i}",
    		ctx
    	});

    	return block;
    }

    // (103:18) {#each item.content.headers as header}
    function create_each_block_3(ctx) {
    	let th;
    	let t_value = /*header*/ ctx[14] + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			attr_dev(th, "class", "svelte-13uruo9");
    			add_location(th, file$1, 103, 20, 3339);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*monitorItems*/ 1 && t_value !== (t_value = /*header*/ ctx[14] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(103:18) {#each item.content.headers as header}",
    		ctx
    	});

    	return block;
    }

    // (111:20) {#each row as cell}
    function create_each_block_2(ctx) {
    	let td;
    	let t_value = /*cell*/ ctx[11] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "class", "svelte-13uruo9");
    			add_location(td, file$1, 111, 22, 3592);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*monitorItems*/ 1 && t_value !== (t_value = /*cell*/ ctx[11] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(111:20) {#each row as cell}",
    		ctx
    	});

    	return block;
    }

    // (109:16) {#each item.content.rows as row}
    function create_each_block_1(ctx) {
    	let tr;
    	let t;
    	let each_value_2 = /*row*/ ctx[8];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file$1, 109, 18, 3523);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(tr, null);
    				}
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*monitorItems*/ 1) {
    				each_value_2 = /*row*/ ctx[8];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(109:16) {#each item.content.rows as row}",
    		ctx
    	});

    	return block;
    }

    // (93:4) {#each monitorItems as item (item.id)}
    function create_each_block(key_1, ctx) {
    	let div1;
    	let div0;
    	let h3;
    	let t0_value = /*item*/ ctx[5].title + "";
    	let t0;
    	let t1;
    	let t2;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[5].type === 'table') return create_if_block;
    		if (/*item*/ ctx[5].type === 'chart') return create_if_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(h3, "class", "svelte-13uruo9");
    			add_location(h3, file$1, 95, 10, 3083);
    			attr_dev(div0, "class", "item-header svelte-13uruo9");
    			add_location(div0, file$1, 94, 8, 3046);
    			attr_dev(div1, "class", "monitor-item svelte-13uruo9");
    			add_location(div1, file$1, 93, 6, 3010);
    			this.first = div1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			append_dev(div1, t1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*monitorItems*/ 1 && t0_value !== (t0_value = /*item*/ ctx[5].title + "")) set_data_dev(t0, t0_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, t2);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(93:4) {#each monitorItems as item (item.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div5;
    	let div3;
    	let div1;
    	let h2;
    	let t1;
    	let div0;
    	let button0;
    	let svg0;
    	let path0;
    	let t2;
    	let button1;
    	let svg1;
    	let path1;
    	let t3;
    	let div2;
    	let span0;
    	let t5;
    	let span1;
    	let t7;
    	let div4;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let each_value = /*monitorItems*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[5].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Table Monitor";
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t3 = space();
    			div2 = element("div");
    			span0 = element("span");
    			span0.textContent = "Monitor View";
    			t5 = space();
    			span1 = element("span");
    			span1.textContent = "Drag tables and charts";
    			t7 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "svelte-13uruo9");
    			add_location(h2, file$1, 71, 6, 1827);
    			attr_dev(path0, "d", "M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z");
    			add_location(path0, file$1, 75, 12, 2046);
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "fill", "currentColor");
    			attr_dev(svg0, "width", "20");
    			attr_dev(svg0, "height", "20");
    			add_location(svg0, file$1, 74, 10, 1964);
    			attr_dev(button0, "class", "control-btn power-btn svelte-13uruo9");
    			add_location(button0, file$1, 73, 8, 1888);
    			attr_dev(path1, "d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z");
    			add_location(path1, file$1, 80, 12, 2474);
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "currentColor");
    			attr_dev(svg1, "width", "20");
    			attr_dev(svg1, "height", "20");
    			add_location(svg1, file$1, 79, 10, 2392);
    			attr_dev(button1, "class", "control-btn success-btn svelte-13uruo9");
    			add_location(button1, file$1, 78, 8, 2313);
    			attr_dev(div0, "class", "buttons svelte-13uruo9");
    			add_location(div0, file$1, 72, 6, 1857);
    			attr_dev(div1, "class", "left svelte-13uruo9");
    			add_location(div1, file$1, 70, 4, 1801);
    			attr_dev(span0, "class", "drag-text svelte-13uruo9");
    			add_location(span0, file$1, 86, 6, 2751);
    			attr_dev(span1, "class", "subtitle svelte-13uruo9");
    			add_location(span1, file$1, 87, 6, 2802);
    			attr_dev(div2, "class", "right svelte-13uruo9");
    			add_location(div2, file$1, 85, 4, 2724);
    			attr_dev(div3, "class", "header svelte-13uruo9");
    			add_location(div3, file$1, 69, 2, 1775);
    			attr_dev(div4, "class", "monitor-grid svelte-13uruo9");
    			add_location(div4, file$1, 91, 2, 2882);
    			attr_dev(div5, "class", "monitor-container svelte-13uruo9");
    			add_location(div5, file$1, 68, 0, 1740);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, span0);
    			append_dev(div2, t5);
    			append_dev(div2, span1);
    			append_dev(div5, t7);
    			append_dev(div5, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div4, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handleCloseAll*/ ctx[1], false, false, false, false),
    					listen_dev(button1, "click", /*handleSelectAll*/ ctx[2], false, false, false, false),
    					listen_dev(div4, "dragover", handleDragOver, false, false, false, false),
    					listen_dev(div4, "drop", /*handleDrop*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*monitorItems*/ 1) {
    				each_value = /*monitorItems*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div4, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
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

    function handleDragOver(e) {
    	e.preventDefault();
    	e.dataTransfer.dropEffect = 'copy';
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TableMonitor', slots, []);
    	const dispatch = createEventDispatcher();

    	let monitorItems = [
    		{
    			id: 'table-1',
    			type: 'table',
    			title: 'Participants',
    			content: {
    				headers: ['Name', 'Status', 'Duration', 'Quality'],
    				rows: [
    					['John Doe', 'Active', '1:23:45', 'HD'],
    					['Jane Smith', 'Active', '1:20:15', 'HD'],
    					['Mike Johnson', 'Away', '0:45:30', 'SD']
    				]
    			}
    		},
    		{
    			id: 'chart-1',
    			type: 'chart',
    			title: 'Network Quality',
    			content: {
    				type: 'line',
    				data: {
    					labels: ['0s', '10s', '20s', '30s', '40s', '50s'],
    					values: [95, 92, 98, 85, 90, 95]
    				}
    			}
    		}
    	];

    	function handleCloseAll() {
    		$$invalidate(0, monitorItems = []);
    		dispatch('closeAll');
    	}

    	function handleSelectAll() {
    		dispatch('selectAll', { items: monitorItems });
    	}

    	function handleDrop(e) {
    		e.preventDefault();
    		const sourceType = e.dataTransfer.getData('sourceType');
    		const sourceId = e.dataTransfer.getData('sourceId');
    		const sourceData = e.dataTransfer.getData('sourceData');

    		if (!monitorItems.find(item => item.id === sourceId)) {
    			try {
    				const content = sourceData ? JSON.parse(sourceData) : null;

    				$$invalidate(0, monitorItems = [
    					...monitorItems,
    					{
    						id: sourceId,
    						type: sourceType,
    						title: content?.title || 'New Item',
    						content
    					}
    				]);
    			} catch(err) {
    				console.error('Failed to add monitor item:', err);
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<TableMonitor> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		monitorItems,
    		handleCloseAll,
    		handleSelectAll,
    		handleDragOver,
    		handleDrop
    	});

    	$$self.$inject_state = $$props => {
    		if ('monitorItems' in $$props) $$invalidate(0, monitorItems = $$props.monitorItems);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [monitorItems, handleCloseAll, handleSelectAll, handleDrop];
    }

    class TableMonitor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TableMonitor",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let sidebar;
    	let t0;
    	let div3;
    	let header;
    	let t1;
    	let div2;
    	let div0;
    	let videowall;
    	let t2;
    	let div1;
    	let tablemonitor;
    	let t3;
    	let rightmenu;
    	let current;
    	sidebar = new Sidebar({ $$inline: true });
    	sidebar.$on("menuSelect", handleMenuSelect);
    	sidebar.$on("sourceSelect", handleSourceSelect);

    	header = new Header({
    			props: { isRecording: /*isRecording*/ ctx[0] },
    			$$inline: true
    		});

    	videowall = new VideoWall({ $$inline: true });
    	videowall.$on("sourceAdded", handleSourceAdded);
    	tablemonitor = new TableMonitor({ $$inline: true });
    	rightmenu = new RightMenu({ $$inline: true });
    	rightmenu.$on("recordingToggle", /*handleRecordingToggle*/ ctx[1]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div3 = element("div");
    			create_component(header.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			create_component(videowall.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(tablemonitor.$$.fragment);
    			t3 = space();
    			create_component(rightmenu.$$.fragment);
    			attr_dev(div0, "class", "video-wall-section svelte-1sophsr");
    			add_location(div0, file, 34, 3, 865);
    			attr_dev(div1, "class", "monitor-section svelte-1sophsr");
    			add_location(div1, file, 37, 3, 964);
    			attr_dev(div2, "class", "main-content svelte-1sophsr");
    			add_location(div2, file, 33, 2, 835);
    			attr_dev(div3, "class", "content svelte-1sophsr");
    			add_location(div3, file, 31, 1, 784);
    			attr_dev(main, "class", "svelte-1sophsr");
    			add_location(main, file, 26, 0, 687);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(sidebar, main, null);
    			append_dev(main, t0);
    			append_dev(main, div3);
    			mount_component(header, div3, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			mount_component(videowall, div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			mount_component(tablemonitor, div1, null);
    			append_dev(main, t3);
    			mount_component(rightmenu, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const header_changes = {};
    			if (dirty & /*isRecording*/ 1) header_changes.isRecording = /*isRecording*/ ctx[0];
    			header.$set(header_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(videowall.$$.fragment, local);
    			transition_in(tablemonitor.$$.fragment, local);
    			transition_in(rightmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(videowall.$$.fragment, local);
    			transition_out(tablemonitor.$$.fragment, local);
    			transition_out(rightmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(sidebar);
    			destroy_component(header);
    			destroy_component(videowall);
    			destroy_component(tablemonitor);
    			destroy_component(rightmenu);
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

    function handleMenuSelect(event) {
    	console.log('Selected menu item:', event.detail.id);
    }

    function handleSourceSelect(event) {
    	console.log('Selected source:', event.detail.id);
    }

    function handleSourceAdded(event) {
    	console.log('Source added:', event.detail);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let isRecording = false;

    	function handleRecordingToggle(event) {
    		$$invalidate(0, isRecording = event.detail.isRecording);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Sidebar,
    		RightMenu,
    		Header,
    		VideoWall,
    		TableMonitor,
    		isRecording,
    		handleMenuSelect,
    		handleSourceSelect,
    		handleRecordingToggle,
    		handleSourceAdded
    	});

    	$$self.$inject_state = $$props => {
    		if ('isRecording' in $$props) $$invalidate(0, isRecording = $$props.isRecording);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isRecording, handleRecordingToggle];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
