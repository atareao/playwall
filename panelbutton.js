/*
 * Copyright (c) 2022 Lorenzo Carbonell <a.k.a. atareao>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const {St, GObject} = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.Slider;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Extension.uuid);
const _ = Gettext.gettext;

var PlayWallButton = GObject.registerClass(
    class PlayWallButton extends PanelMenu.Button{
        _init(videoWallpaper){
            super._init(St.Align.START);
            this._videoWallpaper = videoWallpaper;

            /* Icon indicator */
            let box = new St.BoxLayout({styleClass: "panel-status-menu-box"});
            this.icon = new St.Icon({styleClass: "system-status-icon"});
            box.add(this.icon);
            this.add_child(box);

            /* menu */
            let volume = new St.BoxLayout({
                vertical: false,
                x_expand: true,
                trackHover: false,
                canFocus: false,
            });
            let volumeIcon = new St.Icon({styleClass: "audio-speakers-symbolic"});
            this.volumeSlider = new Slider.Slider(0);
            this.volumeSliderValueChangedId = this.volumeSlider.connect("value-changed", (_, value, _) =>{
                this._videoWallpaper.volume = value * 100;
            });
            volume.add_child(volumeIcon);
            volume.add_child(this.volumeSlider, {expand: true});

            this.playbackSwitch = new PopupMenu.PopupSwitchMenuItem(_("Playback"));
            this.playbackSwitchToggledId = this.playbackSwitch.connect("toggled", (actor)=>{
                this._videoWallpaper.playback = actor.state;
            });

            this.loopSwitch = new PopupMenu.PopupSwitchMenuItem(_("Loop Video"));
            this.loopSwitchToggledId = this.loopSwitch.connect("toggled", (actor)=>{
                this._videoWallpaper.loop = actor.state;
            });
            this.settingsMenuItem = new PopupMenu.PopupMenuItem(_("Settings"));
            this.settingsMenuItemActivateId = this.settingsMenuItem.connect('activate', () => {
                ExtensionUtils.openPrefs();
            });
            this.menu.addMenuItem(volume);
            this.menu.addMenuItem(this.playbackSwitch);
            this.menu.addMenuItem(this.loopSwitch);
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.menu.addMenuItem(this.settingsMenuItem);
        }

        destroy(){
            this.volumeSlider.disconnect(this.volumeSliderValueChangedId);
            this.playbackSwitch.disconnect(this.playbackSwitchToggledId);
            this.loopSwitch.disconnect(this.loopSwitchToggledId);
            this.settingsMenuItem.disconnect(this.settingsMenuItemActivateId);
            super.destroy();
        }
    }
);
