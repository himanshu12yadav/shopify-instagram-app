import {
  Grid,
  MediaCard,
  VideoThumbnail,
} from "@shopify/polaris";

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

export default ModalGridComponent;
