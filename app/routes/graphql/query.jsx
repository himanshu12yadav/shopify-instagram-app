export async function createSubscription(admin, returnUrl) {
  const CREATE_SUBSCRIPTION_MUTATION = `
   mutation CreateAppSubscription{
    appSubscriptionCreate(
    name:"Pro Plan",
    returnUrl:"${returnUrl}",
    test:${process.env.NODE_ENV !== "production"},
    lineItems:[
     {
      plan:{
        appRecurringPricingDetails:{
          price:{
            amount:2,
            currencyCode:"USD"
          }
          interval:"EVERY_30_DAYS"
        }
      }
     }
    ]){
      appSubscription{
        id
        confirmationUrl
      }
      userErrors{
        field
        message
      }
    }
   }
  `;

  const response = await admin.graphql(CREATE_SUBSCRIPTION_MUTATION);
  return response.json();
}

export async function getSubscriptionStatus(admin) {
  const SUBSCRIPTION_QUERY = `
    query CurrentInstallation{
     currentAppInstallation {
        activeSubscriptions {
          id
          status
          trialEndsOn
          currentPeriodEnd
        }
      }
    }
  `;

  const response = await admin.graphql(SUBSCRIPTION_QUERY);
  return response.json();
}

export async function getSubscriptionDetails(admin, subscriptionId) {
  const SUBSCRIPTION_DETAIL_QUERY = `
    query SubscriptionDetails($id: ID!) {
      appSubscription(id: $id) {
        id
        name
        status
        trialEndsOn
        currentPeriodEnd
        createdAt
        test
        lineItems {
          plan {
            pricingDetails {
              ... on AppRecurringPricing {
                price {
                  amount
                  currencyCode
                }
                interval
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(SUBSCRIPTION_DETAIL_QUERY, {
      variables: {
        id: subscriptionId,
      },
    });

    const { data, errors } = await response.json();

    if (errors) {
      console.error(errors);
      return null;
    }

    return data.appSubscription;
  } catch (error) {
    console.log("Failed to fetch subscription details: ", error);
    return null;
  }
}
