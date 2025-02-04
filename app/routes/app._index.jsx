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
  Checkbox,
  InlineStack,
  Badge,
  Box,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@shopify/app-bridge-react";

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

  const { findUserByInstagramUsername, storeInstagramPosts } = await import(
    "../db.server.js"
  );

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
    const postCreate = await storeInstagramPosts(posts, getDataByUsername.id);

    return await postCreate
      .then((res) => {
        if (Object.keys(res).length > 0) {
          return { data: getDataByUsername };
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  return null;
};

export default function Index() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [open, setIsOpen] = useState(false);

  const handleModalOpen = useCallback(() => setIsOpen((prev) => !prev), []);
  const handleModalClose = useCallback(() => setIsOpen((prev) => !prev), []);

  const { accounts } = loaderData;

  const [selected, setSelected] = useState("");
  const [userData, setUserData] = useState({});
  const [selectedPosts, setSelectedPosts] = useState([]);

  const submit = useSubmit();

  useEffect(() => {
    setUserData(actionData?.data);
  }, [actionData]);

  useEffect(() => {
    submit({ username: selected }, { method: "POST" });
  }, [selected]);

  const handleSelectChange = useCallback(
    (id) => {
      setSelectedPosts((prev) => {
        const newPosts = [...prev];
        // find if present
        const index = prev.findIndex((item) => item.id === id);
        // if present change state
        if (index !== -1) {
          newPosts[index] = {
            ...newPosts[index],
            checked: !newPosts[index].checked,
          };
          return newPosts;
        } else {
          return [...newPosts, { id: id, checked: true }];
        }
      });
    },
    [selectedPosts],
  );

  const instagramUrl =
    "https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=624455150004028&redirect_uri=https://elvis-sharp-charming-chick.trycloudflare.com/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";

  const handleConnect = () => {
    window.top.location.href = instagramUrl;
  };

  useEffect(() => {
    console.log(selectedPosts);
  }, [selectedPosts]);

  return (
    <Page
      title="Instagram Integration"
      subtitle="Connect and manage your Instagram business accounts"
      primaryAction={
        <Button
          primary
          onClick={handleModalOpen}
          disabled={selectedPosts.filter((item) => item.checked).length === 0}
        >
          View Selected Posts (
          {selectedPosts.filter((item) => item.checked).length})
        </Button>
      }
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
              <Grid>
                {userData?.posts?.map((post) => (
                  <Grid.Cell
                    key={post.id}
                    columnSpan={{ xs: 6, sm: 4, md: 3, lg: 3 }}
                  >
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          zIndex: "1",
                        }}
                      >
                        <Checkbox
                          checked={selectedPosts.some(
                            (item) =>
                              item.id === post.id && item.checked === true,
                          )}
                          label={post.caption}
                          onChange={(checked, id) => handleSelectChange(id)}
                          id={post.id}
                        />
                      </div>

                      <MediaCard
                        portrait
                        title={post.username}
                        description={post.caption || "No caption"}
                        timestamp={new Date(
                          post.timestamp,
                        ).toLocaleDateString()}
                      >
                        {post.mediaType === "VIDEO" ? (
                          <VideoThumbnail
                            videoLength={0}
                            thumbnailUrl={post.thumbnailUrl}
                            onClick={() =>
                              window.open(post.permalink, "_blank")
                            }
                          />
                        ) : (
                          <img
                            src={post.mediaUrl || post.thumbnailUrl}
                            alt={post.caption || "Instagram post"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              aspectRatio: "1/1",
                            }}
                            onClick={() =>
                              window.open(post.permalink, "_blank")
                            }
                          />
                        )}
                      </MediaCard>
                    </div>
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
        <Modal open={open} onHide={handleModalClose} variant={"large"}>
          <Box
            padding={"200"}
            style={{ paddingTop: "20px", paddingBottom: "20px" }}
          >
            <BlockStack gap="100" style={{ maxWidth: "800px", margin: "auto" }}>
              <Grid>
                {userData?.posts
                  ?.filter((post) => {
                    return selectedPosts.some(
                      (item) => item.id == post.id && item.checked,
                    );
                  })
                  .map((post) => {
                    return (
                      <Grid.Cell
                        key={post.id}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        columnSpan={{ xs: 6, sm: 4, md: 3, lg: 3 }}
                      >
                        <MediaCard
                          portrait
                          title={post.username}
                          description={post.caption || "No caption"}
                          style={{ maxWidth: "250px", margin: "auto" }}
                        >
                          {post.mediaType === "VIDEO" ? (
                            <VideoThumbnail
                              videoLength={0}
                              thumbnailUrl={post.thumbnailUrl}
                              onClick={() =>
                                window.open(post.permalink, "_blank")
                              }
                            />
                          ) : (
                            <img
                              src={post.mediaUrl || post.thumbnailUrl}
                              alt={post.caption || "Instagram post"}
                              style={{
                                width: "100%",
                                height: "auto",
                                objectFit: "cover",
                                aspectRatio: "10px",
                              }}
                              onClick={() =>
                                window.open(post.permalink, "_blank")
                              }
                            />
                          )}
                        </MediaCard>
                      </Grid.Cell>
                    );
                  })}
              </Grid>
            </BlockStack>
          </Box>
        </Modal>
      </Layout>
    </Page>
  );
}
