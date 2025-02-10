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
  Spinner,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@shopify/app-bridge-react";

import { RefreshIcon } from "@shopify/polaris-icons";

import {
  Link,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";

import axios from "axios";
import {
  getAllInstagramPostbyAccountId,
  updatePostData,
} from "../db.server.js";

// loader function
export const loader = async ({ request }) => {
  const { getAllInstagramAccounts } = await import("../db.server.js");
  const accounts = await getAllInstagramAccounts();

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

const ModalGridComponent = ({ posts }) => {
  return (
    <Grid>
      {posts
        ?.filter((post) => post.selected)
        .map((post) => (
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
              description={post.caption || "No captoin"}
              style={{
                maxWidth: "100%",
              }}
            >
              {post.mediaType === "VIDEO" ? (
                <VideoThumbnail
                  videoLength={0}
                  thumbnailUrl={post.thumbnailUrl}
                  onClick={() => window.open(post.permalink, "_blank")}
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
                  onClick={() => window.open(post.permalink, "_blank")}
                />
              )}
            </MediaCard>
          </Grid.Cell>
        ))}
    </Grid>
  );
};

// action function
export const action = async ({ request }) => {
  const formData = await request.formData();

  const { findUserByInstagramUsername, storeInstagramPosts, findPostById } =
    await import("../db.server.js");

  // getting selected account
  const selectedAccount = formData.get("selectedAccount");

  // getting checked post
  const checkedPost = JSON.parse(formData.get("checkedPost"));

  // refresh the posts
  const refreshInstagramPosts = JSON.parse(
    formData.get("refreshInstagramPosts"),
  );

  if (refreshInstagramPosts) {
    const { refresh, selectedAccount } = refreshInstagramPosts;

    const { instagramToken: accessToken } =
      await findUserByInstagramUsername(selectedAccount);

    if (refresh) {
      const { data } = await axios.get(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}`,
      );
      const currentPosts = data.data;

      const oldPosts = await getAllInstagramPostbyAccountId(selectedAccount);
      console.log("currentPosts", currentPosts);
      console.log("oldPosts", oldPosts);
      return null;

      /**
       * comparing old id with current id if present i extract it.
       */

      const tempOld = currentPosts.filter((post) => {
        return oldPosts.some(({ id }) => id === post.id);
      });

      /**
       * comparing old id with current id if not present i create it.
       *
       */

      const tempNew = currentPosts.filter((post) => {
        return oldPosts.some(({ id }) => id !== post.id);
      });

      const updatedPosts = [...tempOld, ...tempNew];
      console.log("updatedPosts", updatedPosts.length);

      return null;
    }
  }

  if (checkedPost && Object.keys(checkedPost).length > 0) {
    const postId = checkedPost.id;
    const selectionStatus = checkedPost.checked;
    const currentPost = await findPostById(postId);

    if (postId && currentPost.id) {
      const { account } = currentPost;
      await updatePostData(currentPost.id, "selected", selectionStatus);
      return {
        data: await getAllInstagramPostbyAccountId(account),
      };
    }

    return null;
  }

  if (selectedAccount) {
    const dbUsername = await findUserByInstagramUsername(selectedAccount);
    const accessToken = dbUsername?.instagramToken;

    if (dbUsername.posts.length > 0) {
      console.log("posts", dbUsername.posts);
      const posts = await getAllInstagramPostbyAccountId(dbUsername.id);

      return {
        data: posts,
      };
    }

    const response = await axios.get(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}`,
    );

    const posts = await response.data.data;

    // save data in database
    await storeInstagramPosts(posts, dbUsername.id);
    return { data: await getAllInstagramPostbyAccountId(dbUsername.id) };
  }

  return null;
};

// component function

export default function Index() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [open, setIsOpen] = useState(false);
  const [selectPost, setSelectPost] = useState({ id: "", checked: false });

  const [selected, setSelected] = useState({});
  const [userData, setUserData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [totalSelectedPost, setTotalSelectedPost] = useState(0);

  const { accounts } = loaderData;

  const instagramUrl =
    "https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=624455150004028&redirect_uri=https://certificates-dancing-cheese-actors.trycloudflare.com/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";

  const submit = useSubmit();

  // useEffect start here

  useEffect(() => {
    setLoading(true);
    setUserData(actionData?.data);
    setLoading(false);
  }, [actionData]);

  useEffect(() => {
    submit({ selectedAccount: selected }, { method: "POST" });
  }, [selected, submit]);

  useEffect(() => {
    submit({ checkedPost: JSON.stringify(selectPost) }, { method: "POST" });
  }, [selectPost]);

  useEffect(() => {
    let count = 0;

    if (userData && userData) {
      const totalCount = userData.filter((item) => item.selected).length;
      count = totalCount;
    }

    setTotalSelectedPost(count);
  }, [userData]);

  // end here

  if (userData) {
    console.log("userData", userData);
  }

  const handleConnect = () => {
    window.top.location.href = instagramUrl;
  };

  const handleModalOpen = useCallback(() => setIsOpen((prev) => !prev), []);
  const handleModalClose = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <Page
      title="Instagram Integration"
      subtitle="Connect and manage your Instagram business accounts"
      primaryAction={
        <Button primary onClick={handleModalOpen}>
          View Selected Posts <Badge>{totalSelectedPost}</Badge>
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
              <InlineStack align="space-between" gap="500">
                <Text variant={"headingMd"} as={"h2"}>
                  Instagram Posts
                </Text>
                <Button
                  primary
                  icon={RefreshIcon}
                  onClick={() => {
                    const payload = {
                      refresh: true,
                      selectedAccount: selected,
                    };
                    submit(
                      { refreshInstagramPosts: JSON.stringify(payload) },

                      { method: "POST" },
                    );
                  }}
                >
                  Update Posts
                </Button>
              </InlineStack>

              <Grid>
                {userData?.map((post) => (
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
                          checked={post.selected}
                          label={post.caption}
                          onChange={() =>
                            setSelectPost({
                              id: post.id,
                              checked: !post.selected,
                            })
                          }
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
              <ModalGridComponent posts={userData} />
            </BlockStack>
          </Box>
        </Modal>
      </Layout>
    </Page>
  );
}
