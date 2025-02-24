import {
  Button,
  Page,
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
  Box
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@shopify/app-bridge-react";

import  ModalGridComponent  from "../components/ModalGridComponent.jsx";
import { SelectComponent } from "../components/SelectComponent.jsx";
import { SkeletonCard } from "../components/SkeletonCard.jsx";
import { AutoComplete } from "../components/AutoComplete.jsx";

import { RefreshIcon } from "@shopify/polaris-icons";
import  debounce from "lodash/debounce";


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

import { ClientOnly } from "../hooks/useHydrated.jsx";

// loader function
export const loader = async ({ request }) => {
  const { getAllInstagramAccounts } = await import("../db.server.js");
  const accounts = await getAllInstagramAccounts();

  return json({ accounts });
};


// action function
export const action = async ({ request }) => {
  const formData = await request.formData();

  const {
    findUserByInstagramUsername,
    storeInstagramPosts,
    findPostById,
    deleteAllPostByAccountId,
    getFilteredInstagramPosts

  } = await import("../db.server.js");

  // getting selected account
  const selectedAccount = JSON.parse(formData.get("selectedAccount"));


  // getting checked post
  const checkedPost = JSON.parse(formData.get("checkedPost"));

  // refresh the posts
  const refreshInstagramPosts = JSON.parse(
    formData.get("refreshInstagramPosts"),
  );

  // search query
  const searchQuery = JSON.parse(formData.get('searchQuery'));


  if (searchQuery) {
    const search = searchQuery?.searchTerm[0];
    const filterValue = searchQuery?.filterValue;
    const username = Object.keys(searchQuery?.selected).length > 0 ? searchQuery?.selected : null;

    console.log("search Query: ",searchQuery);

    if (username && (search || filterValue !== 'all')) {
      const filterResult = await getFilteredInstagramPosts(search, filterValue, username);

      const captionLists = filterResult.map((post) => ({
        label: post.caption == null ? "No caption" : post.caption,
        value: post.caption,
      })).filter((item) => item.value !== null);

      return { data: filterResult, captionLists }

    } else if (username && (search || filterValue == 'all')) {
      const filterResult = await getFilteredInstagramPosts(search, filterValue, username);

      const captionLists = filterResult.map((post) => ({
        label: post.caption == null ? "No caption" : post.caption,
        value: post.caption,
      })).filter((item) => item.value !== null);

      return { data: filterResult, captionLists }
    }
  }

  // refresh Instagran post
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

      await storeInstagramPosts(currentPosts, id);

      const captionLists = currentPosts.map((post) => ({
        label: post.caption == null ? "No caption" : post.caption,
        value: post.caption,
      })).filter((item) => item.value !== null);

      console.log(captionLists)

      return {
        data: await getAllInstagramPostbyAccountId(id),
        captionLists
      };
    }
  }

  // posted checked for show on website
  if (checkedPost && Object.keys(checkedPost).length > 0) {
    const postId = checkedPost.id;
    const selectionStatus = checkedPost.checked;
    const currentPost = await findPostById(postId);

    if (postId && currentPost.id) {
      const { account } = currentPost;
      await updatePostData(currentPost.id, "selected", selectionStatus);
      const posts = await getAllInstagramPostbyAccountId(account);

      const captionLists = posts.map((post) => ({
        label: post.caption == null ? "No caption" : post.caption,
        value: post.caption,
      })).filter((item) => item.value !== null);

      return {
        data: await getAllInstagramPostbyAccountId(account),
        captionLists
      };
    }

    return null;
  }


  // query for selectedAccount
  if (selectedAccount && Object.keys(selectedAccount).length > 0) {
    const dbUsername = await findUserByInstagramUsername(selectedAccount?.account);
    const accessToken = dbUsername?.instagramToken;

    if (!dbUsername) return null;

    if (dbUsername.posts.length > 0) {

      const posts = await getAllInstagramPostbyAccountId(dbUsername.id);

      const captionLists = posts.map((post) => ({
        label: post.caption == null ? "No caption" : post.caption,
        value: post.caption,
      })).filter((item) => item.value !== null);

      return {
        data: posts,
        captionLists
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
  const [filterValue, setFilterValue] = useState("all");


  const options = [
    { label: "All", value: "all" },
    { label: "Image", value: "IMAGE" },
    { label: "Video", value: "VIDEO" },
  ];

  const { accounts } = loaderData;

    useEffect(()=>{
      console.log("actionData: ", actionData);
    },[actionData]);

  const instagramUrl =
    "https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=624455150004028&redirect_uri=https://patrol-kenya-invitation-detector.trycloudflare.com/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";

  const submit = useSubmit();

  // useEffect start here

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        const payload = {
          selected,
          searchTerm: value || "",
          filterValue
        };
        submit({ searchQuery: JSON.stringify(payload) }, { method: "POST" });
      }, 3000),
    [selected, filterValue]
  );

const handleSearch = (value)=>{
  setSearchTerm(value);
  if (value.length >= 2) { // Only search with 2+ characters
    debouncedSearch(value);
  }
}

  // const handleSearch = (value) => {
  //   let payload = null;
  //   if (value.length > 0) {
  //     setSearchTerm(value);
  //     payload = {
  //       selected,
  //       searchTerm: value,
  //       filterValue
  //     }
  //   } else {
  //     payload = {
  //       selected,
  //       searchTerm: "",
  //       filterValue
  //     }
  //   }
  //   submit({ searchQuery: JSON.stringify(payload) }, { method: "POST" })
  // }



  useEffect(() => {
    setUserData(actionData?.data);
    setCaptionList(actionData?.captionLists);
  }, [actionData]);

  useEffect(() => {
    setIsLoading(false);
  }, [userData]);

  useEffect(() => {
    setIsLoading(true);
    if (!selected) {
      setCaptionList([]);
    }
    const payload = {
      account: selected
    }

    submit({ selectedAccount: JSON.stringify(payload) }, { method: "POST" });
  }, [selected, submit]);

  useEffect(() => {
    submit({ checkedPost: JSON.stringify(selectPost) }, { method: "POST" });
  }, [selectPost]);

  useEffect(() => {
    let count = 0;

    if (userData) {
      const totalCount = userData.filter((item) => item.selected).length;
      count = totalCount;
    }

    setTotalSelectedPost(count);
  }, [userData]);


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
              <AutoComplete
                captionList={captionList}
                filterOptions={options}
                setInputValue={handleSearch}
                setFilterValue={setFilterValue}
                selectedAccount={selected}
                searchTerm={searchTerm}
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
                <Pagination />
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
        <ClientOnly>
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
        </ClientOnly>

      </Layout>
    </Page>
  );
}
