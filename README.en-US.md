vue-teleporter <img src="https://img.shields.io/npm/v/vue-teleporter.svg" /> <img src="https://packagephobia.now.sh/badge?p=vue-teleporter" />
========

[简体中文](README.md) | [English](README.en-US.md)

Introduction
------

Vue-teleporter is a functional rendering scheme for Vue components, allowing developers to teleport/render/mount Vue
components in a functional way during the call/use phase.

Cooperate with await/promise to code in a process oriented manner, reducing developers' burden of maintaining the mount
points, visibility, data flow and other pain points of traditional modal boxes (declaratively write down pop-up
components in advance).

Interface
-------
The package vue-teleporter exposes a container component and two functions:
![](https://raw.githubusercontent.com/memo-cn/vue-teleporter/main/resources/figure.1.interface.en-US.svg)

- `teleport` is consistent with the input parameters of `h`, `teleport` can be understood as the alias of `h`;
- `teleport` will directly render the teleported component into the container and return to the manual unmount function;
- Emitting a `return` event on the teleported component will cause it to be unmounted;
- If the `return` event listener is defined, it will be called when the teleported component is unmounted.

> If you are completely unfamiliar with the h function, you can first read the corresponding documents
> of [Vue2](https://v2.cn.vuejs.org/v2/guide/render-function.html)
> or [Vue3](https://cn.vuejs.org/api/render-function.html) versions to have a general impression of its input data
> structure, but this is not necessary.

Life Cycle
------
![](https://raw.githubusercontent.com/memo-cn/vue-teleporter/main/resources/figure.2.life-cycle.en-US.svg)

- Convention: when the teleported component `emits` a `return` event,
  the vue-teleporter considers that it has completed the task of collecting data,
  and automatically unmounts/destroys it.

- The `teleport` function returns an `unmount` function.
  Calling it will forcibly unmount the previously teleported single component,
  and the incoming parameters will also be forwarded to the `return` event listener.

- vue-teleporter also exposes the `unmountAllTeleportedComponents` method,
  which can be called when the project route changes to unmount all teleported components.

- Internally, it is guaranteed that the `return` event listener will be called only once
  (it is necessary and sufficient for the teleported component to be unmounted
  and the `return` event listener to be called).

Get Started Quickly
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

`teleport` function returns a new function, which can be called to unmount the teleported component:

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

When the route changes, call the `unmountAllTeleportedComponents` function to unmount all teleported components:

```javascript
import {unmountAllTeleportedComponents} from 'vue-teleporter';

router.beforeEach(function (to, from, next) {

    setTimeout(unmountAllTeleportedComponents);

    next();
});
```

In this case, when the return event listener is called back, there is no input parameter.

Use JSX syntax:

```jsx
setTimeout(teleport(
    <div
        style="
            position: fixed; top: 1em; right: 1em;
            z-index: 9999; background-color: #eee;
        "
    >
        Prompt information, automatically close after 3 seconds.
    </div>
), 3000);
```

You may think that you can continue to encapsulate a set of UI frameworks.

It is unnecessary. Please consider directly reusing third-party modal box components:

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

Now we don't need to pay attention to the visible attribute,
It is always true during the life cycle of teleported components.

