/* eslint-disable */
import * as Vue from 'vue';

let {nextTick, h, version, set, del} = Vue;

const isVue2 = version.startsWith('2.');

if (!isVue2) {
    // vue3 用的 Proxy 不需要 set、del 了, 直接进行原生操作。
    set = function (object, key, value) {
        object[key] = value;
    };
    del = function (object, key) {
        delete object[key];
    };
}

/* 每次被传送的组件都会被分配一个唯一 key, 作为下面这两个映射对象的 key, 也作为虚拟节点的 key 。*/

/**
 * key 对应的 teleportComponent 的入参, 也是渲染函数的入参。
 * @type {{[key: string]: Parameters<typeof h>}}
 */
const key2arguments = {};

/**
 * key 对应的虚拟节点
 * @type {{[key: string]: VNode}}
 */
const key2VNode = {};

/**
 * 仅仅存储 key
 * @type {{[key: string]: null} | null}
 */
let keys;

/**
 * key 对应的卸载函数
 * @type {{ [key: string]: (...args: any[]) => void }}
 */
const key2unmount = {};

/**
 * 删除 key 对应的对象引用
 * @param key {string}
 * @return {boolean} 删除成功返回 true, 不需要删除返回 false 。
 */
function deleteKey(key) {
    const ret = !!key2unmount[key];
    del(keys, key);
    del(key2arguments, key);
    delete key2unmount[key];
    delete key2VNode[key];
    return ret;
}

/**
 * ③ 外部主动卸载所有被传送的组件;
 * @return {Promise<void>} 组件全部被卸载时返回的 Promise 被兑现。
 */
async function unmountAllTeleportedComponents() {
    for (const unmount of Object.values(key2unmount)) {
        await nextTick(() => unmount());
    }
}

const tip$1 =
    navigator.language.toLowerCase() === 'zh-cn'
        ? '容器组件 <TeleportedComponentContainer> 未就绪, 无法传送组件; 请确保容器组件已被种到合适的位置且处于激活状态。'
        : 'The <TeleportedComponentContainer> is not ready to teleport components; ' +
          'Please ensure that it has been inserted to the appropriate location and is active.';

function teleport() {
    if (!keys) {
        throw tip$1;
    }

    // 随机生成一个 key
    const key = 'c' + Number.parseInt(String(Math.random() * 10e16)).toString(36);

    const data = arguments[1];

    // 记下 return 函数, vue2 和 vue3 传入的数据结构有差异。
    let originalOnReturn = data?.on?.return || data?.onReturn;

    // ④ 手动卸载传送组件。
    function unmount() {
        const ret = deleteKey(key);
        if (originalOnReturn instanceof Function) {
            if (ret) {
                originalOnReturn.apply(null, arguments);
            }
            originalOnReturn = null;
        }
    }

    // 缓存组件、属性和卸载函数
    set(key2arguments, key, arguments);
    set(keys, key, null);
    key2unmount[key] = unmount;

    return unmount;
}

async function onContainerUnmount() {
    await unmountAllTeleportedComponents();
    if (keys === this.keys) {
        keys = null;
    } else {
        // keys 可能已经被另一个容器实例覆盖了, 现在无需再置空。
    }
}

// 容器组件
const TeleportedComponentContainer = {
    data() {
        return {
            keys: {},
        };
    },

    beforeDestroy: onContainerUnmount,

    beforeUnmount: onContainerUnmount,

    mounted() {
        keys = this.keys;
    },

    render() {
        // vue2 会传进来 createElement, vue3 则不是, 而是 props 。
        const h1 = isVue2 ? arguments[0] : h;

        // 所有被传送的组件对应的虚拟节点
        const vNodes = [];

        for (const key in this.keys) {
            const args = key2arguments[key];
            const vNode = getVNodeWithAttributePenetration(key, args, h);
            vNodes.push(vNode);
        }

        return h1('div', {}, vNodes);
    },
};

// 获取被传送组件对应的 VNode
function getVNodeWithAttributePenetration(key, args, h) {
    if (key2VNode[key]) {
        return key2VNode[key];
    }

    const argc = args.length;

    let [tag, data, children] = args;
    let [type, props] = args;

    // 原先的 onReturn 函数, 可能没有。
    let originalOnReturn;

    // 包装的 onReturn 函数, ① 在组件内部 $emit('return', ... 回调参数) 时被触发。
    function wrappedOnReturn() {
        const ret = deleteKey(key);
        if (originalOnReturn instanceof Function) {
            if (ret) {
                originalOnReturn.apply(null, arguments); // 回调原先的 return 事件处理函数
            }
            originalOnReturn = null;
        }
    }

    // 确保 tag, data, children 或者 type, props, children 顺序准确和满足允许挂入 return 事件的数据结构。
    if (isVue2) {
        if (argc === 2) {
            if (data instanceof Array || typeof data === 'string') {
                // 用户的意图应为省略第 2 个参数
                children = data;
                data = {};
            }
        }
        if (!(data instanceof Object)) {
            data = {};
        }
        if (!(data.on instanceof Object)) {
            data.on = {};
        }
    } else {
        if (!(props instanceof Object)) {
            props = {};
        }
    }

    // 包裹原始的 return 事件处理函数
    if (isVue2) {
        originalOnReturn = data.on.return;
        data.on.return = wrappedOnReturn;
    } else {
        originalOnReturn = props.onReturn;
        props.onReturn = wrappedOnReturn;
    }

    // 矫正参数位置
    args = isVue2 ? [tag, data, children] : [type, props, children];

    // 设置 key
    Object.assign(args[1], {key});

    return (key2VNode[key] = h.apply(null, args));
}

export {TeleportedComponentContainer, teleport, unmountAllTeleportedComponents};
