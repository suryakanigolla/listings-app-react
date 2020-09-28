import Stripe from "stripe";

const stripe = new Stripe(`${process.env.S_SECRET_KEY}`, {
  apiVersion: "2019-12-03"
});


const createCustomer = async () => {
  const params: Stripe.CustomerCreateParams = {
    description: 'test customer',
    name:"Test Boi",
    address: {
      line1: '510 Townsend St',
      postal_code: '98140',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
    }
  };
 
  const customer: Stripe.Customer = await stripe.customers.create(params);
  
 
  return customer;
};

export const StripeFunc = {
  connect: async (code: string): Promise<Stripe.OAuthToken> => {
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code
    });

    if (!response) {
      throw new Error("failed to connect to stripe");
    }

    return response;
  },
  charge: async (
    amount: number,
    source: string,
    stripeAccount: string
  ): Promise<void> => {

    // let custId = await createCustomer();

    const res = await stripe.charges.create(
      {
        amount,
        currency: "usd",
        source,
        description: "test des",
        customer:"acct_1HVY7PISHkNBF2CN",
        application_fee_amount: Math.round(amount * 0.05),
      },
      { stripeAccount }
    );

    if (res.status !== "succeeded") {
      throw new Error("failed to created charge with Stripe.");
    }
  },
  disconnect: async(stripeUserId: string) => {
    const response = await stripe.oauth.deauthorize({
      client_id: process.env.S_CLIENT_ID!,
      stripe_user_id: stripeUserId
    });

    return response;
  }
};
