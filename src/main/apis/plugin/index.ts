import { SaltDogPluginActivator } from './activator';
import { app } from 'electron';
import { existsSync, readdirSync, readJsonSync } from 'fs-extra';
import { startsWith, extend, set, has } from 'lodash';
import { normalize } from 'path';
import { ChildProcess } from 'child_process';
import SaltDogMessageChannel from './api/messageChannel';
const TAG = 'SaltDogPlugin';
class SaltDogPlugin {
    private _plugins: Map<string, ISaltDogPluginInfo> = new Map();
    private _pluginHosts: Map<string, ChildProcess> = new Map();
    private _pluginMessageChannel: Map<string, SaltDogMessageChannel> = new Map();
    private _activator: SaltDogPluginActivator;
    public pluginPath = normalize(app.getPath('userData') + '/SaltDogPlugins');
    constructor() {
        this._activator = new SaltDogPluginActivator(this);
    }
    // 加载appdata/SaltDogPlugins下的所有插件
    // TODO: 禁用插件
    public init(): void {
        const plugindir = readdirSync(this.pluginPath).filter((item) => {
            return item.startsWith('saltdogplugin_');
        });
        // 读取插件manifest.json
        plugindir.forEach((item) => {
            if (existsSync(this.pluginPath + '/' + item + '/manifest.json')) {
                try {
                    const pluginInfo = readJsonSync(this.pluginPath + '/' + item + '/manifest.json');
                    this._plugins.set(
                        pluginInfo.name,
                        extend(pluginInfo, { rootDir: normalize(this.pluginPath + '/' + item) })
                    );
                } catch (e) {
                    console.log(
                        'Read plugin manifest.json error, path:',
                        normalize(this.pluginPath + '/' + item + '/manifest.json'),
                        e
                    );
                }
            }
        });
        this._plugins.forEach((item) => {
            // TODO: 依据激活事件激活插件
            this._activator.activatePlugin(item);
        });
    }
    public setPluginHost(name: string, host: ChildProcess): void {
        this._pluginHosts.set(name, host);
    }
    public setMessageChannel(name: string, channel: SaltDogMessageChannel): void {
        this._pluginMessageChannel.set(name, channel);
    }
    public workspaceGetBasicPluginInfo(): any {
        const pluginInfo: any = {};

        this._plugins.forEach((plugin) => {
            const info = {};
            // 处理activitybar 即左侧sidebaricon数据
            if (has(plugin, 'contributes.viewsContainers.activitybar')) {
                set(info, 'sidebarIcon', []);
                // @ts-ignore
                plugin.contributes.viewsContainers.activitybar.forEach((item) => {
                    try {
                        // @ts-ignore
                        info.sidebarIcon.push({
                            iconPath: normalize(plugin.rootDir + '/' + item.icon),
                        });
                    } catch (e) {
                        console.log(TAG, `plugin ${plugin.name} workspaceGetBasicPluginInfo-activitybar failed`, e);
                    }
                });
            }
            pluginInfo[plugin.name] = info;
        });
        return pluginInfo;
    }
}
export default new SaltDogPlugin();
