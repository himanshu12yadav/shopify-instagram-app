import {
  Button,
  Page,
  Select,
  Layout,
  Card,
  BlockStack,
  Text,
  Grid,
  FooterHelp,
  Pagination,
  MediaCard,
  VideoThumbnail,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useCallback, useEffect, useState } from "react";

import {
  Link,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";

import axios from "axios";

export const loader = async ({ request }) => {
  const { getAllInstagramAccounts } = await import("../db.server.js");
  const accounts = await getAllInstagramAccounts();
  console.log("accounts: ", accounts);
  return json({ accounts });
};

export const SelectComponent = ({ allOption = [], option }) => {
  const [selected, setSelected] = useState({});
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let options = allOption?.map((item) => ({
      value: item.instagramUsername,
      label: item.instagramUsername,
    }));

    if (options.length > 0) {
      options.unshift({ label: "Select an option", value: "" });
    } else {
      options = [{ label: "No option", value: "" }];
    }

    setOptions(options);
  }, [allOption]);

  const handleSelectChange = useCallback(
    (value) => {
      setSelected(value);
      option(value);
    },
    [selected],
  );

  return (
    <Select
      label="Username"
      options={options}
      onChange={handleSelectChange}
      value={selected}
    />
  );
};

export const action = async ({ request }) => {
  const formData = await request.formData();

  const {
    findUserByInstagramUsername,
    getAllInstagramAccounts,
    storeInstagramPosts,
  } = await import("../db.server.js");

  // getting formData
  const username = formData.get("username");

  // find by username if not empty

  if (username) {
    const getDataByUsername = await findUserByInstagramUsername(username);

    // user existing in database and posts length is greater than 0.
    if (getDataByUsername.posts.length > 0) {
      return {
        data: getDataByUsername,
      };
    }

    // getting token from getDataByUsername
    const accessToken = getDataByUsername.instagramToken;

    const response = await axios.get(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}`,
    );

    const posts = response.data.data;

    // save data in database
    const postCreate = await storeInstagramPosts(
      posts,
      getDataByUsername.instagramId,
    );

    // return it
    if (Object.keys(postCreate).length > 0) {
      return {
        data: responseData,
      };
    }
  } else {
    return {
      error: "Please connect before getting a post.",
    };
  }
};

export default function Index() {
  const loaderData = useLoaderData();
  const actionData = useActionData();

  const { accounts } = loaderData;

  const [selected, setSelected] = useState("");
  const [userData, setUserData] = useState();

  if (userData) {
    console.log(userData);
  }

  const submit = useSubmit();

  useEffect(() => {
    setUserData(actionData?.data);
  }, [actionData]);

  useEffect(() => {
    submit({ username: selected }, { method: "POST" });
  }, [selected]);

  const instagramUrl =
    "https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=624455150004028&redirect_uri=https://slovakia-vp-mr-glance.trycloudflare.com/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";

  const handleConnect = () => {
    window.top.location.href = instagramUrl;
  };

  return (
    <Page
      title="Instagram Integration"
      subtitle="Connect and manage your Instagram business accounts"
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <BlockStack gap="500" padding="500">
              <Text as={"h2"} variant={"headingMd"}>
                Select Instagram Account
              </Text>
              <SelectComponent allOption={accounts} option={setSelected} />
              <div style={{ textAlign: "right" }}>
                <Button primary onClick={handleConnect}>
                  Connect to Instagram
                </Button>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card>
            <BlockStack gap="500" padding="500">
              <Text variant={"headingMd"} as={"h2"}>
                Instagram Posts
              </Text>
              <Grid gap="400">
                {userData?.data?.data?.map((item, index) => (
                  <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4 }}>
                    <MediaCard
                      title={item.caption}
                      primaryAction={{
                        content: "View",
                        url: item.permalink,
                      }}
                      description={item.caption}
                      popoverActions={[{ content: "Dismiss" }]}
                      portrait={
                        <VideoThumbnail
                          source={instagramVideo}
                          poster={item.thumbnail_url}
                          onClick={() => {
                            window.open(item.permalink, "_blank");
                          }}
                        />
                      }
                    />
                  </Grid.Cell>
                ))}
              </Grid>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Pagination label={2} />
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <FooterHelp>
            <BlockStack gap="400" alignment={"center"}>
              <Text as={"p"} alignment={"center"}>
                Learn more about {""}
                <Link
                  to={
                    "https://help.shopify.com/manual/promoting-marketing/social-media/instagram"
                  }
                >
                  Instagram integration
                </Link>
              </Text>
              <Text variant={"bodySm"} as={"p"} color={"subdued"}>
                © 2024 Your App Name. All rights reserved.
              </Text>
            </BlockStack>
          </FooterHelp>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
