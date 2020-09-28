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
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const types_1 = require("./types");
const types_2 = require("../../../lib/types");
const utils_1 = require("../../../lib/utils");
const api_1 = require("../../../lib/api");
const verifyHostListingInput = (input) => {
    const { title, description, type, price } = input;
    if (title.length > 100) {
        throw new Error("listing title must be under 100 characters.");
    }
    if (description.length > 5000) {
        throw new Error("listing description must be under 5000 characters.");
    }
    if (type !== types_2.ListingType.Apartment && type !== types_2.ListingType.House) {
        throw new Error("Listing type must be either apartment or house.");
    }
    if (price < 0) {
        throw new Error("Price must be greater than 0.");
    }
};
exports.ListingResolvers = {
    Query: {
        listing: (_root, { id }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            try {
                const listing = yield db.listings.findOne({ _id: new mongodb_1.ObjectId(id) });
                if (!listing) {
                    throw new Error("listing can't be found");
                }
                const viewer = yield utils_1.authorize(db, req);
                if (viewer && ((_a = viewer) === null || _a === void 0 ? void 0 : _a._id) === listing.host) {
                    listing.authorized = true;
                }
                return listing;
            }
            catch (error) {
                throw new Error(`Failed to query listing: ${error}`);
            }
        }),
        listings: (_root, { location, filter, limit, page }, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const query = {};
                const data = {
                    region: null,
                    total: 0,
                    result: []
                };
                if (location) {
                    const { country, admin, city } = yield api_1.Google.geocode(location);
                    if (city)
                        query.city = city;
                    if (admin)
                        query.admin = admin;
                    if (country) {
                        query.country = country;
                    }
                    else {
                        throw new Error("no country found");
                    }
                    const cityText = city ? `${city}, ` : "";
                    const adminText = admin ? `${admin}, ` : "";
                    data.region = `${cityText}${adminText}${country}`;
                }
                let cursor = db.listings.find(query);
                if (filter === types_1.ListingsFilter.PRICE_LOW_TO_HIGH) {
                    cursor.sort({
                        price: 1
                    });
                }
                if (filter === types_1.ListingsFilter.PRICE_HIGH_TO_LOW) {
                    cursor.sort({
                        price: -1
                    });
                }
                cursor.skip(page > 0 ? (page - 1) * limit : 0).limit(limit);
                data.total = yield cursor.count();
                data.result = yield cursor.toArray();
                return data;
            }
            catch (error) {
                throw new Error(`Failed to query listings: ${error}`);
            }
        })
    },
    Mutation: {
        hostListing: (_root, { input }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            verifyHostListingInput(input);
            const viewer = yield utils_1.authorize(db, req);
            if (!viewer) {
                throw new Error("viewer can't be found.");
            }
            const { country, admin, city } = yield api_1.Google.geocode(input.address);
            if (!country || !admin || !city) {
                throw new Error("invalid address input.");
            }
            const imageUrl = yield api_1.Cloudinary.upload(input.image);
            const insertResult = yield db.listings.insertOne(Object.assign(Object.assign({ _id: new mongodb_1.ObjectId() }, input), { image: imageUrl, bookings: [], bookingsIndex: {}, country,
                admin,
                city, host: viewer._id }));
            const insertedListing = insertResult.ops[0]; //find the inserted listing among listings 
            yield db.users.updateOne(//and add the listing's id in user listings
            { _id: viewer._id }, {
                $push: {
                    listings: insertedListing._id
                }
            });
            return insertedListing;
        })
    },
    Listing: {
        id: ({ _id }) => _id.toString(),
        host: ({ host }, _args, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield db.users.findOne({ _id: host });
            if (!user) {
                throw new Error("host can't be found");
            }
            return user;
        }),
        bookingsIndex: ({ bookingsIndex }) => {
            return JSON.stringify(bookingsIndex);
        },
        bookings: ({ authorized, bookings }, { limit, page }, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!authorized) {
                    return null;
                }
                const data = {
                    total: 0,
                    result: []
                };
                let cursor = db.bookings.find({ _id: { $in: bookings } });
                cursor.skip(page > 0 ? (page - 1) * limit : 0).limit(limit);
                data.total = yield cursor.count();
                data.result = yield cursor.toArray();
                return data;
            }
            catch (error) {
                throw new Error(`Failed to query listing's bookings: ${error}`);
            }
        })
    }
};
