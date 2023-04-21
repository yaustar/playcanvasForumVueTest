const SwitchingTextures = {
    watch: {
        initScript: function () {
            this.initSwitchingTextures();
        }
    },

    methods: {
        initSwitchingTextures() {
            const SwitchingTextures = this.$pc.createScript('switchingTextures');
            // Setup attributes
            // Reference a list of textures that we can cycle through
            SwitchingTextures.attributes.add("textures", { type: "asset", assetType: "texture", array: true, title: "Textures" });
            SwitchingTextures.attributes.add('changeOnSpin', { type: 'boolean', default: false, title: 'Change On Spin', description: 'Whether textures should be re-assigned as the entity spins' });
            SwitchingTextures.attributes.add('emissive', { type: 'boolean', default: false, title: 'Emissive?', description: 'Whether the textures should be assigned as emissive' });
            SwitchingTextures.attributes.add("textureIndex", { type: "number", default: 0, title: "Texture Index" });

            // initialize code called once per entity
            SwitchingTextures.prototype.initialize = function () {
                this.setInitialTextures = this.setInitialTextures.bind(this);
                this.initializeTextureAssignment = this.initializeTextureAssignment.bind(this);

                setTimeout(this.initializeTextureAssignment, 50);
            };

            SwitchingTextures.prototype.initializeTextureAssignment = function () {
                try {
                    // check for JustAd config texture data         
                    this.configTextureData = window.MobileFuse.PC_CONFIG.textures;
                    this.app.loader.getHandler("texture").crossOrigin = "anonymous";
                    this.changeOnSpin = (this.configTextureData.changeOnSpin === true);
                    this.loadedTextures = 0;
                    this.texturesArray = [];
                    this.entity.texturesLoaded = false;
                    this.emissive = (this.configTextureData.emissive === true);

                    this.alertReady = this.alertReady.bind(this);

                    if (Array.isArray(this.configTextureData.imageNames[0])) {
                        this.imageNamesArray = this.configTextureData.imageNames[this.entity.baseEntityIndex].slice();
                    } else {
                        this.imageNamesArray = this.configTextureData.imageNames.slice();
                    }

                    for (var i = 0; i < this.imageNamesArray.length; i++) {
                        console.log(this.textureIndex || i, this.textureIndex, i);
                        var asset = new pc.Asset("texture_" + (this.entity.baseEntityIndex || 0) + '-' + (this.textureIndex || i), "texture", { url: this.configTextureData.imageFolder + this.imageNamesArray[this.textureIndex || i] });
                        this.app.assets.add(asset);
                        asset.on("load", this.externalImageLoadCompleteHandler, this);
                        asset.on("error", this.externalImageLoadErrorHandler, this);
                        this.app.assets.load(asset);
                    }
                } catch (e) {
                    //If MobileFuse.PC_CONFIG config data is not present.
                    //Make a copy of textures, which will be rotated, if the number of textures is greater than the number of panels
                    this.texturesArray = this.textures.slice();
                    setTimeout(this.setInitialTextures, 50);
                }
            };

            SwitchingTextures.prototype.externalImageLoadCompleteHandler = function (texture) {
                var i = Number(texture.name.split('-')[1]);
                this.texturesArray[i] = this.textures[i] = texture;
                this.loadedTextures++;

                if (this.loadedTextures == this.imageNamesArray.length) {
                    this.setInitialTextures();
                }
            };

            SwitchingTextures.prototype.externalImageLoadErrorHandler = function (err) {
                console.log(err);
            };

            SwitchingTextures.prototype.setInitialTextures = function () {
                //Limit the loop to the lesser of the number of planes or textures.
                //

                if (this.entity._children[0].model) {
                    var len = Math.min(this.texturesArray.length, this.entity._children.length);

                    for (var i = 0; i < len; i++) {
                        var plane = this.entity._children[i];
                        plane.model.material = plane.model.material.clone();
                        plane.model.material.ambientTint = false;
                        this.setFaceTexture(i);
                    }
                } else {
                    this.entity.model.material = this.entity.model.material.clone();
                    this.entity.model.material.ambientTint = false;
                    var mapType = (this.emissive === true) ? 'emissiveMap' : 'diffuseMap';
                    var imageName = this.imageNamesArray[0];

                    console.log(this.texturesArray);

                    this.entity.model.material[mapType] = this.texturesArray[this.textureIndex || 0].resource;
                    this.entity.model.material[mapType].anisotropy = 7;

                    if (imageName.indexOf('.png') === imageName.length - 4) {
                        this.entity.model.material.opacityMap = this.texturesArray[textureIndex].resource;
                        this.entity.model.material.opacityMapChannel = 'a';
                        this.entity.model.material.blendType = pc.BLEND_NORMAL;
                    }

                    // console.log(this.entity.model.material);

                    this.entity.model.material.update();
                }

                this.addRotationListeners();
                this.entity.texturesLoaded = true;
                setTimeout(this.alertReady, 100);
            };

            SwitchingTextures.prototype.alertReady = function () {
                this.app.fire('textures:ready');
            };

            SwitchingTextures.prototype.setFaceTexture = function (planeIndex, textureIndex) {
                if (textureIndex === undefined) textureIndex = planeIndex;
                var plane = this.entity._children[planeIndex];
                var mapType = (this.emissive === true) ? 'emissiveMap' : 'diffuseMap';
                var imageName = this.imageNamesArray[textureIndex];

                plane.model.material[mapType] = this.texturesArray[textureIndex].resource;

                if (imageName.indexOf('.png') === imageName.length - 4) {
                    plane.model.material.opacityMap = this.texturesArray[textureIndex].resource;
                    plane.model.material.opacityMapChannel = 'a';
                    plane.model.material.blendType = pc.BLEND_NORMAL;
                }

                plane.model.material.update();

                if (this.texturesArray.length > this.entity._children.length) {
                    //Check the assigned texture against its initial index to determine what clickID should be received by entityManager.
                    plane.model.entity.clickID = 'Plane_' + this.entity.baseEntityIndex + '-' + this.textures.indexOf(this.texturesArray[textureIndex]);
                }
            };

            //--------------------- Only used if rotationCounter is added to entity ---------------------//

            SwitchingTextures.prototype.addRotationListeners = function () {
                //  If the entity has a rotationTracker script added and there are more textures than planes, 
                //  listen for rotation changes to re-assign textures.
                if (this.changeOnSpin && this.entity._children.length < this.texturesArray.length && this.entity.script.rotationTracker) {
                    this.frontPlaneIndex = 0;
                    this.app.on('rotationTracker:forward', this.forwardRotationHandler, this);
                    this.app.on('rotationTracker:backward', this.backwardRotationHandler, this);
                }
            };

            SwitchingTextures.prototype.forwardRotationHandler = function (e) {
                //rotate textures array forward one index
                if (e.entity.name === this.entity.name) {
                    this.texturesArray.push(this.texturesArray.shift());
                    this.updateTexturesOnRotation();
                }
            };

            SwitchingTextures.prototype.backwardRotationHandler = function (e) {
                //rotate textures array backward one index
                if (e.entity.name === this.entity.name) {
                    this.texturesArray.unshift(this.texturesArray.pop());
                    this.updateTexturesOnRotation();
                }
            };

            SwitchingTextures.prototype.updateTexturesOnRotation = function () {
                //Assign new textures to the planes.
                this.setFaceTexture(this.frontPlaneIndex, 1);
                this.frontPlaneIndex = (this.frontPlaneIndex === 1) ? 0 : 1;
                this.setFaceTexture(this.frontPlaneIndex, 0);
            };
        }
    }
}

export default SwitchingTextures