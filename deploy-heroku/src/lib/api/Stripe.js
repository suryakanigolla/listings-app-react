"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(`${process.env.S_SECRET_KEY}`, {
    apiVersion: "2019-12-03"
});
const createCustomer = () => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        description: 'test customer',
        name: "Test Boi",
        address: {
            line1: '510 Townsend St',
            postal_code: '98140',
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
        }
    };
    const customer = yield stripe.customers.create(params);
    return customer;
});
exports.StripeFunc = {
    connect: (code) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield stripe.oauth.token({
            grant_type: "authorization_code",
            code
        });
        if (!response) {
            throw new Error("failed to connect to stripe");
        }
        return response;
    }),
    charge: (amount, source, stripeAccount) => __awaiter(void 0, void 0, void 0, function* () {
        // let custId = await createCustomer();
        const res = yield stripe.charges.create({
            amount,
            currency: "usd",
            source,
            description: "test des",
            customer: "acct_1HVY7PISHkNBF2CN",
            application_fee_amount: Math.round(amount * 0.05),
        }, { stripeAccount });
        if (res.status !== "succeeded") {
            throw new Error("failed to created charge with Stripe.");
        }
    }),
    disconnect: (stripeUserId) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield stripe.oauth.deauthorize({
            client_id: process.env.S_CLIENT_ID,
            stripe_user_id: stripeUserId
        });
        return response;
    })
};
