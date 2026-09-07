import { ChevronRightIcon } from "lucide-react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MotionFadeIn } from "@/components/shared/motion-fade-in";
import { NavLinkBox } from "@/components/shared/nav-link-box";
import { toErrorKind } from "@/lib/errors";
import { getModelList } from "@/features/catalogue/queries";

const TOP_MODEL_COUNT = 5;

/**
 * Ranks catalogue models by `compatiblePartCount` - "most parts
 * registered as fitting this model" is the real, honest number
 * available, not any sales/popularity metric this app doesn't track.
 * Its own widget/Suspense boundary, same pattern as the rest of the
 * dashboard.
 */
async function TopModelsWidget() {
  let models;
  try {
    models = await getModelList({});
  } catch (error) {
    return (
      <Card>
        {/* No subheader in the error branch - "Ranked by parts
            registered as compatible" describes a list that isn't there. */}
        <CardHeader
          title={<Typography variant="h6">Top models</Typography>}
          sx={{ pb: 1.5, borderBottom: "1px solid var(--rule)" }}
        />
        <CardContent>
          <ErrorState kind={toErrorKind(error)} />
        </CardContent>
      </Card>
    );
  }

  const topModels = models
    .filter((model) => model.compatiblePartCount > 0)
    .sort((a, b) => b.compatiblePartCount - a.compatiblePartCount)
    .slice(0, TOP_MODEL_COUNT);

  return (
    <Card>
      <CardHeader
        title={<Typography variant="h6">Top models</Typography>}
        subheader={
          <Typography variant="caption" color="text.secondary">
            Ranked by parts registered as compatible
          </Typography>
        }
        sx={{ pb: 1.5, borderBottom: "1px solid var(--rule)" }}
      />
      <CardContent>
        {topModels.length === 0 ? (
          <EmptyState
            title="No compatibility data yet"
            description="Link parts to models in the catalogue to see this list."
          />
        ) : (
          <MotionFadeIn>
            <Box
              component="ul"
              sx={{
                listStyle: "none",
                m: 0,
                p: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              {topModels.map((model, index) => (
                <Box component="li" key={model.id}>
                  <NavLinkBox
                    href={`/catalogue/models/${model.id}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      borderRadius: "var(--radius-control)",
                      px: 1,
                      py: 0.875,
                      textDecoration: "none",
                      color: "inherit",
                      transition:
                        "background-color 140ms var(--ease-standard)",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Box
                      className="numeric"
                      sx={{
                        display: "flex",
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "var(--radius-chip)",
                        border: "1px solid var(--mui-palette-divider)",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "text.secondary",
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: 500 }}
                      >
                        {model.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ display: "block" }}
                      >
                        {model.brandName}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      className="numeric"
                      color="text.secondary"
                      sx={{ flexShrink: 0, fontWeight: 500 }}
                    >
                      {model.compatiblePartCount}
                    </Typography>
                    <ChevronRightIcon
                      aria-hidden
                      size={16}
                      style={{ flexShrink: 0, opacity: 0.5 }}
                    />
                  </NavLinkBox>
                </Box>
              ))}
            </Box>
          </MotionFadeIn>
        )}
      </CardContent>
    </Card>
  );
}

export { TopModelsWidget };
