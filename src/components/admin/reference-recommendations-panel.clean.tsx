"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import type {
  NotionReferenceMaterial,
  NotionReferenceRecommendations,
  NotionReferenceWebsite,
} from "@/lib/integrations/notion";

type ReferenceRecommendationsPanelProps = {
  recommendations: NotionReferenceRecommendations;
};

export function ReferenceRecommendationsPanel({
  recommendations,
}: ReferenceRecommendationsPanelProps) {
  const hasContent =
    recommendations.materials.length > 0 || recommendations.websites.length > 0;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="ui-section-title">참고 추천 자료</h3>
          <p className="mt-2 text-sm text-text-muted">
            사건 유형, 제목, 서비스 태그를 기준으로 내부 자료와 참고 홈페이지를 함께 추천합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {recommendations.keywords.map((keyword) => (
            <Badge key={keyword}>{keyword}</Badge>
          ))}
        </div>
      </div>

      {!hasContent ? (
        <EmptyState
          className="mt-5"
          title="추천할 참고자료가 아직 없습니다."
          description="Notion 참고자료 DB와 참고 홈페이지 DB가 연결되면 사건 유형에 맞는 자료가 자동으로 추천됩니다."
        />
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-text-strong">내부 참고자료</p>
            {recommendations.materials.length === 0 ? (
              <EmptyState
                title="추천 자료가 없습니다."
                description="분야 태그와 자료 요약이 채워질수록 추천 정확도가 좋아집니다."
              />
            ) : (
              recommendations.materials.map((item) => (
                <ReferenceMaterialCard key={item.id} item={item} />
              ))
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-text-strong">참고 홈페이지</p>
            {recommendations.websites.length === 0 ? (
              <EmptyState
                title="추천 홈페이지가 없습니다."
                description="분야별 사이트 DB에 관련 기관과 용도 설명이 채워질수록 추천 정확도가 좋아집니다."
              />
            ) : (
              recommendations.websites.map((item) => (
                <ReferenceWebsiteCard key={item.id} item={item} />
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function ReferenceMaterialCard({ item }: { item: NotionReferenceMaterial }) {
  return (
    <Card muted className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-strong">{item.title}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.category ? <Badge>{item.category}</Badge> : null}
            {item.resourceType ? <Badge>{item.resourceType}</Badge> : null}
            {item.status ? <Badge>{item.status}</Badge> : null}
            {item.publishedYear ? <Badge>{String(item.publishedYear)}</Badge> : null}
          </div>
        </div>
        {item.citationUrl ? (
          <a
            href={item.citationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-md border border-line px-3 text-sm font-medium text-text-strong transition hover:bg-surface"
          >
            자료 열기
          </a>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-text">
        {item.summary || "요약이 아직 없습니다."}
      </p>
      {item.source ? (
        <p className="mt-3 text-xs text-text-muted">출처: {item.source}</p>
      ) : null}
    </Card>
  );
}

function ReferenceWebsiteCard({ item }: { item: NotionReferenceWebsite }) {
  return (
    <Card muted className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-strong">{item.title}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.organization ? <Badge>{item.organization}</Badge> : null}
            {item.fields.map((field) => (
              <Badge key={`${item.id}-${field}`}>{field}</Badge>
            ))}
          </div>
        </div>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-md border border-line px-3 text-sm font-medium text-text-strong transition hover:bg-surface"
          >
            홈페이지 열기
          </a>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-text">
        {item.description || "용도 설명이 아직 없습니다."}
      </p>
    </Card>
  );
}
