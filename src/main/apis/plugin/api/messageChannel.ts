import { ChildProcess } from 'child_process';
import { ipcMain } from 'electron';
import { ISaltDogPluginMessageType } from '../constant';
import { extend, uuid } from 'licia';
import windowManager from '~/main/window/windowManager';
const TAG = '[SaltDogMessageChannel]';
class SaltDogMessageChannel {
    public pluginHost?: ChildProcess;
    public pluginInfo: ISaltDogPluginInfo;
    public api: ISaltDogPluginApi;
    private ticket: string;
    private pendingCallbackId = 0;
    constructor(pluginInfo: ISaltDogPluginInfo, api: ISaltDogPluginApi) {
        this.pluginInfo = pluginInfo;
        this.api = api;
        this.ticket = uuid();
    }
    public bindHost(pluginHost: ChildProcess): void {
        this.pluginHost = pluginHost;
        this.pluginHost.on('message', (msg: any) => {
            switch (msg.type as ISaltDogPluginMessageType) {
                case ISaltDogPluginMessageType.PLUGINHOST_INVOKE:
                    this.handlePluginHostInvoke(msg as ISaltDogPluginInvoke);
                    break;
                case ISaltDogPluginMessageType.PLUGINWEBVIEW_INVOKE_CALLBACK:
                    this.sendToRenderer(msg as ISaltDogPluginWebviewInvokeCallback);
            }
        });
    }

    private handlePluginHostInvoke(msg: ISaltDogPluginInvoke): void {
        if (typeof this.api[msg.api] === 'function') {
            this.api[msg.api](msg.args, (data: any) => {
                this.pluginHost!.send({
                    type: ISaltDogPluginMessageType.PLUGINHOST_INVOKE_CALLBACK,
                    callbackId: msg.callbackId,
                    data,
                } as ISaltDogPluginInvokeCallback);
            });
        } else {
            if (msg.windowId) {
                this.sendToRenderer(msg);
            } else if (windowManager.getCurrentWindow() != null) {
                const id = windowManager.getCurrentWindow()!.id;
                this.sendToRenderer(extend(msg, { windowId: id }), (data: any) => {
                    this.pluginHost!.send({
                        type: ISaltDogPluginMessageType.PLUGINHOST_INVOKE_CALLBACK,
                        callbackId: msg.callbackId,
                        data,
                    } as ISaltDogPluginInvokeCallback);
                });
                console.log(
                    `${TAG} api not found in mainProcess: ${msg.api}, call to rendererProcess with windowId: ${id}`
                );
            } else {
                console.error(
                    `${this.pluginInfo.name}???????????????????????????????????????${msg.api}????????????${JSON.stringify(
                        msg.args
                    )}, ?????????????????????`
                );
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public publishEventToPluginHost(event: string, data: any): void {
        this.pluginHost!.send({
            type: ISaltDogPluginMessageType.HOST_EVENT,
            event,
            data,
        } as ISaltDogPluginHostEventToPlugin);
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public sendToPluginHost(data: any): void {
        this.pluginHost!.send(data);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public sendToRenderer(data: any, callback?: any): void {
        if (windowManager.getById(data.windowId)) {
            console.log(TAG, 'sendToRenderer', data);
            if (callback) {
                if (this.pendingCallbackId >= 65535) this.pendingCallbackId = 0;
                const callbackIdIfExist = 'rdcb_' + this.getTicket() + '_' + this.pendingCallbackId;
                this.pendingCallbackId++;
                data.callbackMainId = callbackIdIfExist;
                ipcMain.once(callbackIdIfExist, (e, d) => {
                    callback(d);
                });
            }
            windowManager.getById(data.windowId)!.webContents.send(data.type, data);
        } else {
            console.error(TAG, 'wrong windowId: do not exist', data.windowId);
        }
    }

    public getTicket(): string {
        return this.ticket;
    }
}
export default SaltDogMessageChannel;
