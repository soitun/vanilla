/**
 * @author Maneesh Chiba <mchiba@higherlogic.com>
 * @copyright 2009-2024 Vanilla Forums Inc.
 * @license Proprietary
 */

import AdminLayout from "@dashboard/components/AdminLayout";
import { ModerationNav } from "@dashboard/components/navigation/ModerationNav";
import { IReport } from "@dashboard/moderation/CommunityManagementTypes";
import { IReportFilters, ReportFilters } from "@dashboard/moderation/components/ReportFilters";
import { ReportStatus } from "@dashboard/moderation/components/ReportFilters.constants";
import { ReportListItem } from "@dashboard/moderation/components/ReportListItem";
import apiv2 from "@library/apiv2";
import { IError } from "@library/errorPages/CoreErrorMessages";
import { AttachmentIntegrationsContextProvider } from "@library/features/discussions/integrations/Integrations.context";
import NumberedPager, { INumberedPagerProps } from "@library/features/numberedPager/NumberedPager";
import { useQuery } from "@tanstack/react-query";
import { t } from "@vanilla/i18n";
import { useState } from "react";
import Loader from "@library/loaders/Loader";
import { useQueryParam, useQueryParamPage } from "@library/routing/routingUtils";
import { useQueryStringSync } from "@library/routing/QueryString";
import { communityManagementPageClasses } from "@dashboard/moderation/CommunityManagementPage.classes";
import { EscalateModal } from "@dashboard/moderation/components/EscalateModal";
import { useTitleBarDevice, TitleBarDevices } from "@library/layout/TitleBarContext";
import { useCollisionDetector } from "@vanilla/react-utils";
import { ISelectBoxItem } from "@library/forms/select/SelectBox";
import { Sort } from "@library/sort/Sort";
import SimplePagerModel, { ILinkPages } from "@library/navigation/SimplePagerModel";

const defaultFilterValues = {
    statuses: [ReportStatus.NEW],
    reportReasonID: [],
    insertUserID: [],
    insertUserRoleID: [],
    recordUserID: [],
    sort: "-dateInserted",
    page: 1,
};

const sortOptions = [
    { value: "-dateInserted", name: t("Newest Report") },
    { value: "dateInserted", name: t("Oldest Report") },
];

interface IReportsData {
    results: IReport[];
    pagination: ILinkPages;
}

export function ReportsPage() {
    const cmdClasses = communityManagementPageClasses();

    const device = useTitleBarDevice();
    const { hasCollision } = useCollisionDetector();
    const isCompact = hasCollision || device === TitleBarDevices.COMPACT;

    const [reportToEscalate, setReportToEscalate] = useState<IReport | null>(null);

    const initialStatuses = useQueryParam("statuses", defaultFilterValues.statuses);
    const initialReasons = useQueryParam("reportReasonID", defaultFilterValues.reportReasonID);
    const initialInsertUserID = useQueryParam("insertUserID", defaultFilterValues.insertUserID);
    const initialInsertUserRoleID = useQueryParam("insertUserRoleID", defaultFilterValues.insertUserRoleID);
    const initialRecordUserID = useQueryParam("recordUserID", defaultFilterValues.recordUserID);

    const [filters, setFilters] = useState<IReportFilters>({
        statuses: initialStatuses,
        reportReasonID: initialReasons,
        insertUserID: initialInsertUserID,
        insertUserRoleID: initialInsertUserRoleID,
        recordUserID: initialRecordUserID,
    });

    const [selectedSort, setSelectedSort] = useState<ISelectBoxItem>();

    const [page, setPage] = useState(useQueryParamPage());

    useQueryStringSync({ ...filters, sort: selectedSort?.value, page }, defaultFilterValues);

    const reports = useQuery<any, IError, IReportsData>({
        queryFn: async () => {
            const response = await apiv2.get("/reports", {
                params: {
                    ...filters,
                    expand: "users",
                    status: filters.statuses,
                    sort: selectedSort?.value ?? defaultFilterValues.sort,
                    limit: 10,
                    page,
                },
            });

            const pagination = SimplePagerModel.parseHeaders(response.headers);

            return {
                results: response.data,
                pagination,
            };
        },
        queryKey: ["reports", filters, selectedSort?.value, page],
        keepPreviousData: true,
    });

    const paginationProps: INumberedPagerProps = {
        totalResults: reports.data?.pagination?.total,
        currentPage: reports.data?.pagination?.currentPage,
        pageLimit: reports.data?.pagination?.limit,
        hasMorePages: reports.data?.pagination?.total ? reports.data?.pagination?.total >= 10000 : false,
    };

    return (
        <>
            <AdminLayout
                title={t("Reports")}
                leftPanel={!isCompact && <ModerationNav />}
                rightPanel={
                    <ReportFilters
                        value={filters}
                        onFilter={(newFilters) =>
                            setFilters((prev) => {
                                return {
                                    ...prev,
                                    ...newFilters,
                                };
                            })
                        }
                    />
                }
                content={
                    <AttachmentIntegrationsContextProvider>
                        <section className={cmdClasses.secondaryTitleBar}>
                            <span>
                                <Sort
                                    sortOptions={sortOptions}
                                    selectedSort={selectedSort}
                                    onChange={setSelectedSort}
                                />
                            </span>
                            <NumberedPager
                                className={cmdClasses.pager}
                                isMobile={false}
                                showNextButton={false}
                                onChange={setPage}
                                {...paginationProps}
                            />
                        </section>
                        <section className={cmdClasses.content}>
                            {reports.isLoading && (
                                <div>
                                    <Loader />
                                </div>
                            )}
                            {reports.isSuccess && reports.data.results.length === 0 && (
                                <div>
                                    <p>{t("All reports are handled! 😀")}</p>
                                </div>
                            )}
                            {reports.isSuccess && (
                                <div className={cmdClasses.list}>
                                    {reports.data.results.map((report: IReport) => {
                                        return (
                                            <ReportListItem
                                                key={report.reportID}
                                                to={`/dashboard/content/triage/${report.recordID}`}
                                                report={report}
                                                onEscalate={(report) => {
                                                    setReportToEscalate(report);
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                        <EscalateModal
                            recordID={reportToEscalate?.recordID ?? null}
                            recordType={reportToEscalate?.recordType ?? null}
                            report={reportToEscalate}
                            isVisible={!!reportToEscalate}
                            onClose={() => {
                                setReportToEscalate(null);
                            }}
                        />
                    </AttachmentIntegrationsContextProvider>
                }
            />
        </>
    );
}

export default ReportsPage;
