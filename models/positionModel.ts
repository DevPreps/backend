import { PrismaClient, Position } from "@prisma/client";
import { prisma } from "./prisma";

const Positions = (prismaPosition: PrismaClient["position"]) => {
    const customMethods: CustomMethods = {
        getAllPositions: async () => {
            return prismaPosition.findMany({});
        },
    };

    return Object.assign(prismaPosition, customMethods);
};

const positionModel = Positions(prisma.position);

export default positionModel;

export declare namespace PositionMethods {
    export type GetAllPositions = () => Promise<Position[] | null>;
}

interface CustomMethods {
    getAllPositions: PositionMethods.GetAllPositions;
}
