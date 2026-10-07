import type {MaterialOverride} from './project';
export const materialFamilies={
 paint:{color:'#a3b2b9',metallic:0.8,roughness:0.25,clearcoat:1,clearcoatRoughness:0.1,transmission:0,ior:1.5},
 metal:{color:'#a8afb4',metallic:1,roughness:0.28,clearcoat:0,clearcoatRoughness:0.1,transmission:0,ior:1.5},
 glass:{color:'#dce6e5',metallic:0,roughness:0.06,clearcoat:0,clearcoatRoughness:0.1,transmission:0.95,ior:1.5},
 leather:{color:'#754b34',metallic:0,roughness:0.75,clearcoat:0,clearcoatRoughness:0.1,transmission:0,ior:1.5},
 carbon:{color:'#333333',metallic:0.5,roughness:0.32,clearcoat:0.9,clearcoatRoughness:0.1,transmission:0,ior:1.5},
 rubber:{color:'#141718',metallic:0,roughness:0.92,clearcoat:0,clearcoatRoughness:0.1,transmission:0,ior:1.5},
} satisfies Record<string,MaterialOverride>;
