vue-teleporter
========

[简体中文](README.zh_CN.md) | [English](README.md)

vue-teleporter provides the `teleport` function to teleport/render/mount Vue2/3 components functionally,

It reduces the maintenance burden (separation of concerns) of the mount point, visibility and data flow of the traditional modal box.

Quickly understand
-------

- `teleport` is consistent with the input parameters of `h`, `teleport` can be understood as the alias of `h`;


- `h` returns the `VNode` object, and `teleport` directly renders the teleported components to a container;
- Emitting a `return` event on the teleported component will cause it to be unmounted;
- The defined `return` event listener will be called when the teleported component is unmounted.

Preparatory knowledge
-------

Learn about [Vue2 rendering function API](https://v2.vuejs.org/v2/guide/render-function.html) or [Vue3 rendering function API](https://vuejs.org/api/render-function.html).

Get started quickly
-------
install:

```bash
npm i vue-teleporter
```

In App.vue or other suitable place to insert the Teleported Component Container:
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

use the `teleport` method to teleport/render/mount a component (to the Teleported Component Container):
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

Emitting a `return` event on the teleported MyConfirm.vue component:
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
      <button @click="$emit('return', false);">Cancel</button>
      <button @click="$emit('return', true);">Ok</button>
    </div>
  </div>
</template>
<script>
export default {
  props: ['message']
}
</script>
```

Best Practices
-------

- `teleport` function returns a new function, which can be called to unmount the teleported component:

```typescript
async function my_Vue3_confirm(message): Promise<boolean> {
    return new Promise(function (resolve) {
        var manualUnmount = teleport(MyConfirm, {
            message,
            onReturn($event) {
                resolve($event);
            }
        });

        // Manually unmount the teleported component without operation within 5 seconds.
        setTimeout(function () {
            manualUnmount(false); // It is deemed to be canceled.
        }, 5_000);

    });
}
```

- When the route changes, call the `unmountAllTeleportedComponents` function to unmount all teleported components:
```javascript
import {unmountAllTeleportedComponents} from 'vue-teleporter';

router.beforeEach(function (to, from, next) {

    setTimeout(unmountAllTeleportedComponents);

    next();
});
```

In this case, when the return event listener is called back, there is no input parameter.

- Reuse third-party modal box components:

```vue

<template>
  <el-dialog :visible="true" @close="$emit('return', false);">
    <p>
      {{ message }}
    </p>
    <div>
      <button @click="$emit('return', false);">Cancel</button>
      <button @click="$emit('return', true);">Ok</button>
    </div>
  </el-dialog>
</template>
<script>
export default {
  props: ['message']
}
</script>
```
Now we don't need to pay attention to the visible attribute.

