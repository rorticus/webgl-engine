# Importing Animations from Blender

Blender 2.8 is a great way to get animations into GLTF format, as it can import and
export a variety of formats.

The end goal is to have a single GLTF file with multiple animations defined.

## Actions
In Blender, any Action in the source file gets exported to the GLTF file.

![image-20200710063823246](/Users/rory/Desktop/Projects/webgl-engine/docs/blender-overview.png)

## Creating a GLTF file with multiple animations

Creating a GLTF with multiple animations is a twofold process. First, we create a `.blend` file containing the base pose and each animation. Second, we export as GLTF!

### Importing Actions

In order to attach actions to an armature, you need to open the base pose (with the skeleton) and then import each action into your scene.  This isn't as terrible as it sounds.

1. First, open the base pose. Using kenny's character assets, this means opening something like `Models/Source/characterMedium.blend`.  You should see the character in the base pose.

2. Next, open the _Animations_ view. You should see `Root` and `characterMedium` nodes.

3. Select the `Root` node, either in the _Action Editor_ or in the _Object Navigator_ on the right. Once selected, you should see the bones of model highlighted.

4. With the `Root` node selected, go to _File_ -> _Append_ and choose the `.blend` file containing the animation you want to import. Inside the `.blend` file, go to `Action` and choose the Action you wish to import. In my experience there is a target pose and an animation. Choose the animation. In this case, `Interact_ground`.

![image-20200710064750792](/Users/rory/Desktop/Projects/webgl-engine/docs/blender-append-action.png)

> If you are trying to import from an FBX file, import the FBX into a blank file first, then save it as a `.blend` file and append it using this method.

5. Great, the action should be attached to our armature now. In the _Action Editor_, click _Action Dropdown_ and select the imported action. Once selected, you can drag the slider and see your model animate. Woop!

![image-20200710064958788](/Users/rory/Desktop/Projects/webgl-engine/docs/select-imported-action.png)

Repeat these steps for every action you want to include.  If these actions have funny names, now might be a good time to rename them. Each action name gets directly imported as an animation state during the GLTF import process, so the name you choose is somewhat important. In the _Action Dropdown_ just click the name of the action and type in a new name.

### Export a GLTF

This is the easy part. Go to _File_ -> _Export_ -> _GLTF_ .  Make sure your settings are alright and hit export!

![image-20200710065521508](/Users/rory/Desktop/Projects/webgl-engine/docs/gltf-export.png)

