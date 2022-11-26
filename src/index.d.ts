import {DefineComponent, h} from 'vue';

// 容器组件
export const TeleportedComponentContainer: DefineComponent;

// 卸载所有被传送的组件
export function unmountAllTeleportedComponents(): Promise<void>;

/**
 * @desc teleport/传送 一个组件, 渲染到 TeleportedComponentContainer/容器 被种下的地方。
 *
 * 以下行为会导致传送组件被卸载, return 事件（如果有）被触发：
 *
 *   ① 在组件内部发出 return 事件;
 *   ② 主动调用 unmount 函数;
 *   ③ 外部主动调用 unmountAllTeleportedComponents 卸载所有被传送的组件;
 *
 * @param args {Parameters<typeof h>}
 * @return 主动调用返回的 unmount 函数将卸载传送组件(如果它还没有被卸载), 传入的参数也作为 return（如果定义了）事件的回调参数。
 */
export function teleport(...args: (Parameters<typeof h>) | any[]): (...args: any[]) => void;
