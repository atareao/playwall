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

const {St} = imports.gi;
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
            let _volume = new St.BoxLayout({
                vertical: false,
                x_expand: true,
                trackHover: false,
                canFocus: false,
            });
            let _volumeIcon = new St.Icon({styleClass: "audio-speakers-symbolic"});
            let _volumeSlider = new Slider.Slider(0);
            _volumeSlider.connect("value-changed", () =>{
                this._onVolumeChanged();
            });
            _volume.add_child(_volumeIcon);
            _volume.add_child(_volumeSlider, {expand: true});
        }
    }
);
