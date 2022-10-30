vue-teleporter <img src="https://img.shields.io/npm/v/vue-teleporter.svg" /> <img src="https://packagephobia.now.sh/badge?p=vue-teleporter" />
========

[简体中文](README.md) | [English](README.en-US.md)

简介
------

vue-teleporter 是一种 Vue 组件函数式渲染方案，允许开发者在调用/使用阶段，函数式地传送/渲染/挂载 Vue 组件。

配合 await / Promise，用面向过程的方式进行编码，减免开发者对传统模态框（声明式地预先种下弹窗组件）挂载点、可见性和数据流等痛点的维护负担。

接口
-------
包 vue-teleporter 暴露了 1 个容器组件和组件传送、批量卸载 2 个函数:
![](https://raw.githubusercontent.com/memo-cn/vue-teleporter/main/resources/figure.1.interface.en-US.svg)

- `teleport` 函数与 `h` 函数的入参一致, 可将 `teleport` 理解为 `h` 的别名;
- `teleport` 会将被传送的组弹窗件直接渲染至容器内, 并返回手动卸载函数;
- 在弹窗组件内部发出 `return` 事件将导致其被卸载;
- 如果定义了 `return` 事件监听器，它在弹窗组件被卸载时触发。

> 如果你对 h 函数完全陌生，可以先阅读 [Vue2](https://v2.cn.vuejs.org/v2/guide/render-function.html)
> 或 [Vue3](https://cn.vuejs.org/api/render-function.html) 版本相应文档来对其入参数据结构有一个大致的印象，但这不是必须的。

生命周期
------
![](https://raw.githubusercontent.com/memo-cn/vue-teleporter/main/resources/figure.2.life-cycle.zh-CN.svg)

- 约定：在弹窗组件内部发出（`emit`）`return` 事件时，vue-teleporter 会认为它已完成收集数据的使命，并将其自动卸载/销毁;
- `teleport` 函数返回一个卸载（`unmount` ）函数，调用它会强制卸载先前被传送的单个弹窗组件，入参也会被一并转发至 `return`
  事件监听器;
- vue-teleporter 还暴露了 `unmountAllTeleportedComponents` 方法，可以在项目路由发生改变时调用以卸载全部被传送的弹窗组件;
- 内部会保证 `return` 事件监听器只会且一定会被调用一次（弹窗组件被卸载和 `return` 事件监听器被调用是充分必要条件）。

快速上手
-------

安装:

```bash
npm i vue-teleporter
```

在 App.vue 或其它合适位置种下容器组件:

```vue
<!-- Vue2/Vue3 -->
<template>
  <div id="app">
    ...
    <TeleportedComponentContainer></TeleportedComponentContainer>
  </div>
</template>

<!-- Vue3 only -->
<template>
  <div id="app">
    ...
  </div>
  <teleport>
    <TeleportedComponentContainer></TeleportedComponentContainer>
  </teleport>
</template>

<script>
import {TeleportedComponentContainer} from 'vue-teleporter';

export default {
  name: 'App',
  components: {
    TeleportedComponentContainer,
  }
}
</script>
```

调用 `teleport` 方法传送/渲染/挂载组件(至刚刚种下的容器内):

```typescript
import MyConfirm from '... MyConfirm.vue';
import {teleport} from 'vue-teleporter';

async function my_Vue2_confirm(message): Promise<boolean> {
    return new Promise(function (resolve) {
        var manualUnmount = teleport(MyConfirm, {
            props: {
                message,
            },
            on: {
                return($event) {
                    resolve($event);
                },
            },
        });
    });
}

async function my_Vue3_confirm(message): Promise<boolean> {
    return new Promise(function (resolve) {
        var manualUnmount = teleport(MyConfirm, {
            message,
            onReturn($event) {
                resolve($event);
            }
        });
    });
}
```

在被传送的 MyConfirm.vue 组件内部发出 return 事件:

```vue

<template>
  <div style="
    position: fixed; top: 50vh; left: 50vw; translate: -50% -50%;
    padding: 1em; box-shadow: 0 0 .5em #aaa;"
  >
    <p>
      {{ message }}
    </p>
    <div>
      <button @click="$emit('return', false);">取消</button>
      <button @click="$emit('return', true);">确定</button>
    </div>
  </div>
</template>
<script>
export default {
  props: ['message']
}
</script>
```

最佳实践
-------

`teleport` 函数返回一个新函数, 可调用它以主动卸载被传送的组件:

```typescript
async function my_Vue3_confirm(message): Promise<boolean> {
    return new Promise(function (resolve) {
        var manualUnmount = teleport(MyConfirm, {
            message,
            onReturn($event) {
                resolve($event);
            }
        });

        // 5 秒内不操作自动卸载传送的组件
        setTimeout(function () {
            manualUnmount(false); // 视为取消。
        }, 5_000);

    });
}
```

路由发生改变时调用 `unmountAllTeleportedComponents` 函数卸载所有被传送的组件:

```javascript
import {unmountAllTeleportedComponents} from 'vue-teleporter';

router.beforeEach(function (to, from, next) {

    setTimeout(unmountAllTeleportedComponents);

    next();
});
```

这种情况下 return 事件监听器被回调时无入参。

使用 JSX 语法：

```jsx
setTimeout(teleport(
    <div
        style="
            position: fixed; top: 1em; right: 1em;
            z-index: 9999; background-color: #eee;
        "
    >
        提示信息, 3 秒后自动关闭。
    </div>
), 3000);
```

你可能会联想到可以继续封装一套 UI 框架。

大可不必，请考虑直接复用第三方模态框组件:

```vue

<template>
  <el-dialog :visible="true" @close="$emit('return', false);">
    <p>
      {{ message }}
    </p>
    <div>
      <button @click="$emit('return', false);">取消</button>
      <button @click="$emit('return', true);">确定</button>
    </div>
  </el-dialog>
</template>
<script>
export default {
  props: ['message']
}
</script>
```

现在不需要再关注 visible 属性了，它在弹窗组件生命周期内都为 true。