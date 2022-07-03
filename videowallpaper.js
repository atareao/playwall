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

const {Clutter, ClutterGst, Gio, St} = imports.gi;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const BackgroundManager = imports.ui.background.BackgroundManager;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Extension.uuid);
const _ = Gettext.gettext;

var VideoWallpaper = GObject.registerClass(
    class VideoWallpaper extends St.BoxLayout {
        _init(){
            super._init({
                vertical: true,
                reactive: false,
                trackHover: false,
                canFocus: false,
            });
            this._playing = false;
            this._video = null;
            this._settings = null;
            this._onSettingsChangedId = null;

        }

        _loadPreferences(){
            this._enabled = this._settings.get_boolean("enabled");
            this._volume = this._settings.get_int("volume");
            this._loop = this._settings.get_booleand("loope");
        }

        play(){
            this._playing = true;
            if(this._video == null){
                ClutterGst.init(null);
                this._video = new ClutterGst.VideoTexture({syncSize: false});
                this._video.set_size(1, 1);
                this._video.set_position(-1, -1);
                this._video.set_opacity(0);
                Main.layoutManager.uiGroup.add_actor(this._video);
            }
            if(this._settings == null){
                this._settings = ExtensionUtils.getSettings();
                this._onSettingsChangedId = this._settings.connect("changed", ()=>{
                    this._loadPreferences();
                });

            }
        }
    }
)
