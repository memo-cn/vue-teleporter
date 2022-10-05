vue-teleporter
========

[简体中文](README.zh_CN.md) | [English](README.md)

vue-teleporter 提供 `teleport` 函数, 实现函数式传送/渲染/挂载 Vue2/3 组件,

减免对传统模态框挂载点、可见性/visible 和数据流的维护负担（关注点分离）。

快速理解
-------

- `teleport` 与 `h` 的入参一致, 可将 `teleport` 理解为 `h` 的别名;


- `h` 返回 `VNode` 对象, `teleport` 则直接将被传送的组件渲染至容器内;
- 在传送的组件发出 `return` 事件将导致其被卸载;
- 定义的 `return` 事件监听器在被传送的组件被卸载时触发。

预备知识
-------

对 [Vue2 渲染函数 API](https://v2.cn.vuejs.org/v2/guide/render-function.html) 或 [Vue3 渲染函数 API](https://cn.vuejs.org/api/render-function.html) 有一定了解。

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

- `teleport` 函数返回一个新函数, 可调用它以主动卸载被传送的组件:

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

- 路由发生改变时调用 `unmountAllTeleportedComponents` 函数卸载所有被传送的组件:

```javascript
import {unmountAllTeleportedComponents} from 'vue-teleporter';

router.beforeEach(function (to, from, next) {

    setTimeout(unmountAllTeleportedComponents);

    next();
});
```

这种情况下 return 事件监听器被回调时无入参。

- 复用第三方模态框组件:

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
现在不需要再关注 visible 属性了。

