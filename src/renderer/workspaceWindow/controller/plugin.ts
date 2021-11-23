import { WebviewTag } from 'electron';
import { ref } from 'vue';
import sysBus from './systemBus';
const TAG = '[SaltDogPlugin]';
class SaltDogPlugin {
    private _basicInfo: any = {};
    private _sidebarIconList: any = [];
    private _sidebarViews: any = ref([]);
    private _sidebarViewsMap: Map<string, any> = new Map(); // plugin.view--->index in _sidebarViews
    public init(basicInfo: any): void {
        this._basicInfo = basicInfo;
        console.log(TAG, 'basicInfo', this._basicInfo);
        // sysBus.on('onClickSidebarIcon', (cmd) => {
        //     this.loadSidebarViews(cmd);
        // });
    }
    public getSidebarIconListRef(): any {
        const buildinIconPath = __static + '/images/workspace';
        const iconList = [
            {
                iconImg: `${buildinIconPath}/content.svg`,
                description: '目录',
                active: false,
                command: 'onClickSidebarIcon:saltdog.content',
            },
            {
                iconImg: `${buildinIconPath}/search.svg`,
                description: '搜索',
                active: false,
                command: 'onClickSidebarIcon:saltdog.search',
            },
        ];
        if (this._basicInfo) {
            for (const plugin in this._basicInfo) {
                if (this._basicInfo[plugin].sidebarIcon) {
                    this._basicInfo[plugin].sidebarIcon.forEach((icon: any) => {
                        iconList.push({
                            iconImg: icon.iconPath,
                            description: icon.description,
                            active: false,
                            command: `onClickSidebarIcon:${icon.command}`,
                        });
                    });
                }
            }
        }
        this._sidebarIconList = ref(iconList);
        return this._sidebarIconList;
    }
    public getSidebarViewsRef() {
        return this._sidebarViews;
    }
    // 新增webview（插件激活时）
    public loadSidebarViews(viewName: string) {
        if (!viewName.startsWith('onClickSidebarIcon:')) {
            console.warn(`[Sidebar Plugin] load sidebar without 'onCLickSidebarIcon',cmd:${viewName}`);
        } else {
            viewName = viewName.replace('onClickSidebarIcon:', '');
        }
        //viewname = pluginName.viewName
        if (this._sidebarViewsMap.has(viewName)) {
            console.log(`[Sidebar Plugin] Already has sidebar views ${viewName}`);
            // show出webview
            const thisview = this._sidebarViewsMap.get(viewName);
            for (let i = 0; i < this._sidebarViews.value.length; i++) {
                this._sidebarViews.value[i].show = i == thisview;
            }
            return true;
        } else {
            console.log(`[Sidebar Plugin] First load sidebar views ${viewName}`);
            const _view = this._basicInfo[viewName.split('.')[0]].views[viewName.split('.')[1]][0]; // TODO: 可能有多个view,暂时只支持一个
            const alreadyLoadedViewsLen = this._sidebarViews.value.length;
            this._sidebarViewsMap.set(viewName, alreadyLoadedViewsLen); // 记录下标
            const viewinfo = {
                id: `sidebarView_${alreadyLoadedViewsLen}`,
                viewSrc: `${_view.src.split('?')[0]}?ticket=${
                    this._basicInfo[viewName.split('.')[0]]._messageChannelTicket
                }`, //不允许用户?传参,传递和host通信的tickets
                name: _view.name,
                show: true,
            };
            this._sidebarViews.value.push(viewinfo);
            // 关闭其他的webview-show
            // show出webview
            for (let i = 0; i < this._sidebarViews.value.length; i++) {
                this._sidebarViews.value[i].show = i == alreadyLoadedViewsLen;
            }
            console.log(`[Sidebar Plugin] Sidebar views info`, viewinfo);
        }
    }
    // 注册webview事件
    public registerSidebarView(webview: WebviewTag) {
        webview.addEventListener('dom-ready', () => {
            console.log('[Sidebar View] Dom Ready');
            webview.openDevTools();
        });
        webview.addEventListener('ipc-message', (event) => {
            console.log('[Sidebar View]', event.channel, event.args);
        });
    }
}
export default new SaltDogPlugin();
