import { Light } from "./Light";

export class Lights {
    lights: Light[] = [];

    addLight(light: Light) {
        this.lights.push(light);
    }

    getDataByType(type: string, lightType?: string) {
        let sum: any = [];

        if (type === "position") {
            this.lights
                .filter((light) => light.position)
                .forEach((light) => {
                    sum = sum.concat(light.position);
                });
        } else if (type === "direction") {
            this.lights
                .filter((light) => light.direction)
                .forEach((light) => {
                    sum = sum.concat(light.direction);
                });
        } else if (type === "ambientColor") {
            sum = [0, 0, 0];
            this.lights.forEach((light) => {
                sum[0] = sum[0] + light.ambientColor[0];
                sum[1] = sum[1] + light.ambientColor[1];
                sum[2] = sum[2] + light.ambientColor[2];
            });
        } else {
            this.lights
                .filter((light) => (light as any)[lightType])
                .forEach((light) => {
                    sum = sum.concat((light as any)[type]);
                });
        }

        return sum;
    }
}