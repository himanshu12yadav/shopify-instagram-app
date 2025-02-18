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
  TextField,
  SkeletonThumbnail,
  SkeletonBodyText,
  SkeletonDisplayText,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@shopify/app-bridge-react";

import { RefreshIcon } from "@shopify/polaris-icons";

import { SearchIcon } from "@shopify/polaris-icons";
import { Autocomplete, Icon } from "@shopify/polaris";

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

  const {
    findUserByInstagramUsername,
    storeInstagramPosts,
    findPostById,
    deleteAllPostByAccountId,
  } = await import("../db.server.js");

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

    const { instagramToken: accessToken, id } =
      await findUserByInstagramUsername(selectedAccount);

    if (refresh) {
      await deleteAllPostByAccountId(id);

      const { data } = await axios.get(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}`,
      );
      const currentPosts = data.data;

      console.log("Current Posts: ", data);

      await storeInstagramPosts(currentPosts, id);

      return {
        data: await getAllInstagramPostbyAccountId(id),
      };
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

function AutocompleteExample({
  captionList,
  filterOptions,
  setInputValue: setSearchTerm,
}) {
  const deselectedOptions = useMemo(() => [...captionList], [captionList]);

  const [selectedOptions, setSelectedOptions] = useState("");
  const [inputValue, setLocalInputValue] = useState("");
  const [options, setOptions] = useState(deselectedOptions);
  const [isLoading, setIsLoading] = useState(false);
  const [filterOption, setFilterOption] = useState("");

  const updateText = useCallback(
    (value) => {
      setIsLoading(true);
      setLocalInputValue(value);

      if (value === "") {
        setOptions(deselectedOptions);
      }

      const filterRegx = new RegExp(value, "i");
      const resultOptions = deselectedOptions.filter((option) =>
        option.label.match(filterRegx),
      );

      setOptions(resultOptions);
      setIsLoading(false);
    },
    [deselectedOptions, setSearchTerm],
  );

  const handleSelected = useCallback(
    (selected) => {
      const selectedValue = selected.map((selectedItem) => {
        const matchedOption = options.find((option) =>
          option.value.match(selectedItem),
        );

        return matchedOption && matchedOption.label;
      });
      setSearchTerm(selectedValue);
      setSelectedOptions(selectedValue);
      setLocalInputValue(selectedValue[0] || "");
    },
    [options],
  );

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      value={inputValue}
      prefix={<Icon source={SearchIcon} tone="base" />}
      placeholder="Search"
      autocomplete="off"
    />
  );

  return (
    <Box gap="400">
      <InlineStack wrap={false} gap="100" align="start" blockAlign="center">
        <div style={{ width: "100%" }}>
          <Autocomplete
            options={options}
            selected={selectedOptions}
            textField={textField}
            onSelect={handleSelected}
            loading={isLoading}
          />
        </div>
        <div style={{ width: "100px" }}>
          <Select
            label="Filter by type"
            labelHidden
            value={filterOption}
            options={filterOptions}
            onChange={(value) => {
              setFilterOption(value);
            }}
            tone="magic"
          />
        </div>
      </InlineStack>
    </Box>
  );
}

const SkeletonCard = () => {
  return (
    <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 3, lg: 3 }}>
      <div style={{ position: "relative" }}>
        <BlockStack gap="500">
          <Box
            background="bg-subdued"
            borderRadius="100"
            width="20px"
            height="20px"
            style={{
              animation:
                "polaris-SkeletonShimmerAnimation 2.5s linear infinite",
            }}
          />
          <div style={{ width: "100%" }}>
            <SkeletonThumbnail
              style={{
                height: "400px !important",
                objectFit: "cover",
                aspectRatio: "1/1",
              }}
            />
          </div>

          <SkeletonBodyText lines={2} />
        </BlockStack>
      </div>
    </Grid.Cell>
  );
};

export default function Index() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [open, setIsOpen] = useState(false);
  const [selectPost, setSelectPost] = useState({ id: "", checked: false });

  const [selected, setSelected] = useState({});
  const [userData, setUserData] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [totalSelectedPost, setTotalSelectedPost] = useState(0);

  // search filter states
  const [captionList, setCaptionList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const options = [
    { label: "All", value: "all" },
    { label: "Image", value: "IMAGE" },
    { label: "Video", value: "VIDEO" },
  ];

  const { accounts } = loaderData;

  const instagramUrl =
    "https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=624455150004028&redirect_uri=https://bush-treasure-shade-rivers.trycloudflare.com/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";

  const submit = useSubmit();

  // useEffect start here

  useEffect(() => {
    setUserData(actionData?.data);
  }, [actionData]);

  useEffect(() => {
    setIsLoading(false);
  }, [userData]);

  useEffect(() => {
    console.log("userData: ", userData);
    if (userData) {
      const captionList = userData
        .map((item) => {
          if (item.caption !== null) {
            return {
              label: item.caption,
              value: item.caption,
            };
          }

          return null;
        })
        .filter((item) => item !== null);
      console.log("captionList: ", captionList);
      setCaptionList(captionList);
    }
  }, [userData]);

  useEffect(() => {
    setIsLoading(true);
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

  useEffect(() => {
    submit();
  }, [searchTerm]);
  // end here

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

                    setIsLoading(true);

                    submit(
                      { refreshInstagramPosts: JSON.stringify(payload) },

                      { method: "POST" },
                    );
                  }}
                >
                  Update Posts
                </Button>
              </InlineStack>
              <AutocompleteExample
                captionList={captionList}
                filterOptions={options}
                setInputValue={setSearchTerm}
                setFilter={setFilter}
              />
              <Grid>
                {isLoading &&
                  [...Array(10)].map((_, i) => <SkeletonCard key={i} />)}

                {!isLoading &&
                  userData?.map((post) => (
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
