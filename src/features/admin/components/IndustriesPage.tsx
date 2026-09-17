import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addIndustry,
  updateIndustry,
  softDeleteIndustry,
  restoreIndustry,
  permanentDeleteIndustry,
  toggleIndustryActive,
} from '@/store/slices/catalogSlice';
import type { Industry, IndustryGroup } from '@/types/catalog';
import { industryGroupDisplayName } from '@/types/catalog';
import { fetchIndustryGroups } from '@/api';
import SortHeader from '@/components/ui/SortHeader';
import ColumnVisibilityDropdown from '@/components/ui/ColumnVisibilityDropdown';
import Pagination from '@/components/ui/Pagination';
import CustomSelect from '@/components/ui/CustomSelect';
import ImageUploadField from '@/components/ui/ImageUploadField';
import { toast } from '@/lib/toast';

type SortField = 'name' | 'group' | 'createdAt';

export default function IndustriesPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const allIndustries = useAppSelector((state) => state.catalog.industries);
  const deletedIndustries = useAppSelector((state) => state.catalog.deletedIndustries);
  const allJobs = useAppSelector((state) => state.jobs.items);
  const [industryGroups, setIndustryGroups] = useState<IndustryGroup[]>([]);

  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  /** '' = không lọc; 'true' | 'false' = Bật/Tắt */
  const [activeFilter, setActiveFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Industry | null>(null);
  const [detail, setDetail] = useState<Industry | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    groupId: '',
    imageUrl: '',
    imageFile: null as File | null,
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState([
    'image',
    'name',
    'group',
    'count',
    'active',
    'createdAt',
    'actions',
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchIndustryGroups({
          active: true,
          deleted: false,
          page: 1,
          size: 100,
          sort: 'sortOrder,asc',
        });
        if (!cancelled) setIndustryGroups(res.data);
      } catch {
        if (!cancelled) setIndustryGroups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupName = (groupId: string) => {
    const g = industryGroups.find((item) => String(item.id) === String(groupId));
    if (!g) return t('adminUi.common.notAvailable');
    return industryGroupDisplayName(g, i18n.language);
  };

  const groupOptions = useMemo(
    () => [
      { value: '', label: t('adminUi.industries.allGroups') },
      ...industryGroups.map((g) => ({
        value: String(g.id),
        label: industryGroupDisplayName(g, i18n.language),
      })),
    ],
    [industryGroups, t, i18n.language],
  );

  const activeFilterOptions = useMemo(
    () => [
      { value: '', label: t('adminUi.filters.allStatuses') },
      { value: 'true', label: t('adminUi.jobs.on') },
      { value: 'false', label: t('adminUi.jobs.off') },
    ],
    [t],
  );

  const formGroupOptions = useMemo(
    () =>
      industryGroups.map((g) => ({
        value: String(g.id),
        label: industryGroupDisplayName(g, i18n.language),
      })),
    [industryGroups, i18n.language],
  );

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field as SortField);
      setSortOrder('asc');
    }
  };

  const visible = viewMode === 'active' ? allIndustries : deletedIndustries;

  const filtered = useMemo(() => {
    let list = visible.filter((item) => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchGroup = !groupFilter || item.groupId === groupFilter;
      const matchActive =
        !activeFilter ||
        (activeFilter === 'true'
          ? item.isActive !== false
          : item.isActive === false);
      const matchFrom = !dateFrom || (item.createdAt || '') >= dateFrom;
      const matchTo = !dateTo || (item.createdAt || '') <= dateTo;
      return matchSearch && matchGroup && matchActive && matchFrom && matchTo;
    });
    list = [...list].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      if (sortField === 'group') {
        aVal = groupName(a.groupId);
        bVal = groupName(b.groupId);
      } else if (sortField === 'createdAt') {
        aVal = a.createdAt || '';
        bVal = b.createdAt || '';
      } else {
        aVal = a.name;
        bVal = b.name;
      }
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visible,
    search,
    groupFilter,
    activeFilter,
    dateFrom,
    dateTo,
    sortField,
    sortOrder,
    industryGroups,
  ]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter, activeFilter, dateFrom, dateTo, viewMode, pageSize]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', groupId: '', imageUrl: '', imageFile: null });
    setModalOpen(true);
  };

  const openEdit = (item: Industry) => {
    setEditing(item);
    setForm({
      name: item.name,
      groupId: item.groupId,
      imageUrl: item.image || '',
      imageFile: null,
    });
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const resolveImageValue = (): Promise<string> =>
    new Promise((resolve) => {
      if (form.imageFile) {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(form.imageFile);
        return;
      }
      const url = form.imageUrl.trim();
      if (url.startsWith('blob:')) {
        resolve('');
        return;
      }
      resolve(url);
    });

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name || !form.groupId) return;
    const image = await resolveImageValue();
    if (editing) {
      dispatch(
        updateIndustry({
          id: editing.id,
          name,
          groupId: form.groupId,
          image,
        }),
      );
    } else {
      if (
        allIndustries.some((i) => i.name === name) ||
        deletedIndustries.some((i) => i.name === name)
      )
        return;
      dispatch(addIndustry({ name, groupId: form.groupId, image }));
    }
    setModalOpen(false);
  };

  const nameExists =
    !editing &&
    (allIndustries.some((i) => i.name === form.name.trim()) ||
      deletedIndustries.some((i) => i.name === form.name.trim()));

  const imageUnchanged =
    !form.imageFile && form.imageUrl === (editing?.image || '');

  const canSave =
    Boolean(form.name.trim() && form.groupId) &&
    !nameExists &&
    !(
      editing &&
      form.name.trim() === editing.name &&
      form.groupId === editing.groupId &&
      imageUnchanged
    );

  const jobCount = (name: string) =>
    allJobs.filter((j) => !j.deletedAt && j.category === name).length;

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t('adminUi.pageTitles.industries')}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === 'active'
                ? `${filtered.length} / ${allIndustries.length} ${t('adminUi.industries.items')}`
                : `${filtered.length} / ${deletedIndustries.length} ${t('adminUi.jobs.deleted')}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: 'image', label: t('adminUi.columns.logo') },
                { key: 'name', label: t('adminUi.columns.name') },
                { key: 'group', label: t('adminUi.columns.industryGroup') },
                { key: 'count', label: t('adminUi.columns.jobPosts') },
                { key: 'active', label: t('adminUi.columns.active') },
                { key: 'createdAt', label: t('adminUi.columns.createdAt') },
                { key: 'actions', label: t('adminUi.columns.actions') },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            {viewMode === 'active' && (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border border-primary-500 bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line"></i> {t('adminUi.industries.add')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setViewMode('active');
                setSearch('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'active'
                  ? 'border-primary-200 bg-primary-100 text-primary-700'
                  : 'border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100'
              }`}
            >
              <i className="ri-price-tag-3-line"></i>
              {t('adminUi.actions.active')}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('trash');
                setSearch('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'trash'
                  ? 'border-red-200 bg-red-100 text-red-600'
                  : 'border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100'
              }`}
            >
              <i className="ri-delete-bin-line"></i>
              {t('adminUi.actions.trash')}
              {deletedIndustries.length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
                  {deletedIndustries.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[220px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm pointer-events-none"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('adminUi.industries.searchPlaceholder')}
              className="w-full h-10 pl-9 pr-4 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
            />
          </div>
          <div className="w-full sm:w-[220px]">
            <CustomSelect
              value={groupFilter}
              options={groupOptions}
              onChange={setGroupFilter}
              placeholder={t('adminUi.industries.allGroups')}
              outlined
            />
          </div>
          <div className="w-full sm:w-[160px]">
            <CustomSelect
              value={activeFilter}
              options={activeFilterOptions}
              onChange={setActiveFilter}
              placeholder={t('adminUi.filters.allStatuses')}
              outlined
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 px-3 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
            />
            <span className="text-xs text-foreground-400">{t('adminUi.jobs.to')}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 px-3 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
            />
          </div>
          {(search || groupFilter || activeFilter || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setGroupFilter('');
                setActiveFilter('');
                setDateFrom('');
                setDateTo('');
              }}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm rounded-xl border border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-filter-off-line"></i>
              {t('adminUi.actions.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'trash' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700">
            <i className="ri-information-line mr-1"></i>
            {t('adminUi.industries.trashInfo')}
          </p>
        </div>
      )}

      {viewMode === 'active' && industryGroups.length === 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <i className="ri-information-line mr-1"></i>
          {t('adminUi.industries.needGroupFirst')}
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-background-200/70">
                {visibleColumns.includes('image') && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 w-16">
                    {t('adminUi.columns.logo').toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes('name') && (
                  <SortHeader
                    label={t('adminUi.columns.name').toUpperCase()}
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes('group') && (
                  <SortHeader
                    label={t('adminUi.columns.industryGroup').toUpperCase()}
                    field="group"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes('count') && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                    {t('adminUi.columns.jobPosts').toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes('createdAt') && (
                  <SortHeader
                    label={t('adminUi.columns.createdAt').toUpperCase()}
                    field="createdAt"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes('active') && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                    {t('adminUi.columns.active').toUpperCase()}
                  </th>
                )}
                {viewMode === 'trash' && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                    {t('adminUi.columns.deletedAt').toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes('actions') && (
                  <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 w-[80px]">
                    {t('adminUi.columns.actions').toUpperCase()}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-background-100 hover:bg-background-50 transition-colors"
                >
                  {visibleColumns.includes('image') && (
                    <td className="px-5 py-3">
                      {item.image ? (
                        <div className="size-11 shrink-0 overflow-hidden rounded-lg border border-background-200/70 bg-background-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="size-11 shrink-0 rounded-lg bg-primary-100 flex items-center justify-center border border-background-200/50">
                          <i className="ri-price-tag-3-line text-primary-600"></i>
                        </div>
                      )}
                    </td>
                  )}
                  {visibleColumns.includes('name') && (
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setDetail(item)}
                        className="font-medium text-foreground-900 hover:text-primary-500 cursor-pointer text-left"
                      >
                        {item.name}
                      </button>
                    </td>
                  )}
                  {visibleColumns.includes('group') && (
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium">
                        {groupName(item.groupId)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('count') && (
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                        {t('adminUi.industries.postsCount', { count: jobCount(item.name) })}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('createdAt') && (
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                      {item.createdAt || '—'}
                    </td>
                  )}
                  {visibleColumns.includes('active') && (
                    <td className="px-5 py-3 whitespace-nowrap">
                      {viewMode === 'active' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const nextActive = item.isActive === false;
                            dispatch(toggleIndustryActive(item.id));
                            toast.success(
                              nextActive
                                ? t('adminUi.industries.activated')
                                : t('adminUi.industries.deactivated'),
                            );
                          }}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer ${
                            item.isActive !== false
                              ? 'bg-accent-100 text-accent-600 hover:bg-accent-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {item.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                        </button>
                      ) : (
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            item.isActive !== false
                              ? 'bg-accent-100 text-accent-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {item.isActive !== false ? t('adminUi.jobs.on') : t('adminUi.jobs.off')}
                        </span>
                      )}
                    </td>
                  )}
                  {viewMode === 'trash' && (
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                      {item.deletedAt
                        ? new Date(item.deletedAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                  )}
                  {visibleColumns.includes('actions') && (
                    <td className="px-5 py-3 text-right whitespace-nowrap relative">
                      {confirmSoftDelete === item.id && viewMode === 'active' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              dispatch(softDeleteIndustry(item.id));
                              setConfirmSoftDelete(null);
                            }}
                            className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                          >
                            {t('adminUi.jobs.confirmDelete')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmSoftDelete(null)}
                            className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer"
                          >
                            {t('adminUi.actions.cancel')}
                          </button>
                        </div>
                      ) : confirmPermanentDelete === item.id && viewMode === 'trash' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              dispatch(permanentDeleteIndustry(item.id));
                              setConfirmPermanentDelete(null);
                            }}
                            className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                          >
                            {t('adminUi.jobs.deletePermanent')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmPermanentDelete(null)}
                            className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer"
                          >
                            {t('adminUi.actions.cancel')}
                          </button>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setDropdownOpen(dropdownOpen === item.id ? null : item.id)
                            }
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
                          >
                            <i className="ri-more-2-fill text-foreground-500"></i>
                          </button>
                          {dropdownOpen === item.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-20 overflow-hidden">
                              {viewMode === 'active' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDetail(item);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background-100 cursor-pointer"
                                  >
                                    <i className="ri-eye-line text-primary-500"></i>
                                    {t('adminUi.jobs.viewDetails')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEdit(item)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background-100 cursor-pointer"
                                  >
                                    <i className="ri-edit-line text-accent-500"></i>
                                    {t('adminUi.jobs.edit')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmSoftDelete(item.id);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                                  >
                                    <i className="ri-delete-bin-line"></i>
                                    {t('adminUi.jobs.confirmDelete')}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      dispatch(restoreIndustry(item.id));
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 cursor-pointer"
                                  >
                                    <i className="ri-arrow-go-back-line"></i>
                                    {t('adminUi.jobs.restore')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmPermanentDelete(item.id);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                                  >
                                    <i className="ri-delete-bin-6-line"></i>
                                    {t('adminUi.jobs.deletePermanent')}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-price-tag-3-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === 'active'
                ? search || groupFilter || activeFilter
                  ? t('adminUi.industries.noFiltered')
                  : t('adminUi.industries.noFound')
                : t('adminUi.jobs.trashEmpty')}
            </p>
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetail(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5 gap-3">
              <div className="flex items-start gap-4 min-w-0">
                {detail.image ? (
                  <div className="size-28 shrink-0 overflow-hidden rounded-xl border border-background-200/70 bg-background-100">
                    <img
                      src={detail.image}
                      alt={detail.name}
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-28 shrink-0 rounded-xl bg-primary-100 flex items-center justify-center border border-background-200/50">
                    <i className="ri-price-tag-3-line text-3xl text-primary-600"></i>
                  </div>
                )}
                <div className="min-w-0 pt-1">
                  <h3 className="text-lg font-heading font-semibold text-foreground-950 break-words">
                    {detail.name}
                  </h3>
                  <p className="text-xs text-foreground-500 mt-1">{groupName(detail.groupId)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer flex-shrink-0"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500">{t('adminUi.columns.jobPosts')}</p>
                <p className="text-xl font-bold text-foreground-900">{jobCount(detail.name)}</p>
              </div>
              <div className="p-3 bg-background-100 rounded-xl">
                <p className="text-xs text-foreground-500">{t('adminUi.columns.createdAt')}</p>
                <p className="text-sm font-medium text-foreground-900 mt-1">
                  {detail.createdAt || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="flex-1 py-2.5 border border-background-300 rounded-xl text-sm font-medium cursor-pointer min-h-[44px]"
              >
                {t('adminUi.jobs.close')}
              </button>
              {viewMode === 'active' && (
                <button
                  type="button"
                  onClick={() => {
                    setDetail(null);
                    openEdit(detail);
                  }}
                  className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold cursor-pointer min-h-[44px]"
                >
                  {t('adminUi.jobs.edit')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">
                {editing ? t('adminUi.industries.edit') : t('adminUi.industries.add')}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('adminUi.columns.industryGroup')} *
                </label>
                <CustomSelect
                  value={form.groupId}
                  options={formGroupOptions}
                  onChange={(v) => setForm({ ...form, groupId: v })}
                  placeholder={t('adminUi.industries.selectGroup')}
                  required
                />
                {formGroupOptions.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">{t('adminUi.industries.needGroupFirst')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('adminUi.industries.nameLabel')} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]"
                  placeholder={t('adminUi.industries.namePlaceholder')}
                />
                {nameExists && (
                  <p className="text-xs text-red-500 mt-1">{t('adminUi.industries.nameExists')}</p>
                )}
              </div>
              <ImageUploadField
                label={t('adminUi.industries.image')}
                value={form.imageUrl}
                file={form.imageFile}
                onChange={({ url, file }) =>
                  setForm((prev) => ({ ...prev, imageUrl: url, imageFile: file }))
                }
                aspectW={1}
                aspectH={1}
                previewClassName="size-40 max-w-full rounded-xl object-cover border border-background-200/70"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 border border-background-300 rounded-xl text-sm font-medium cursor-pointer min-h-[44px]"
              >
                {t('adminUi.actions.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer min-h-[44px] ${
                  canSave
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-background-200 text-foreground-400 cursor-not-allowed'
                }`}
              >
                {editing ? t('adminUi.jobs.saveChanges') : t('adminUi.industries.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {dropdownOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)}></div>
      )}
    </div>
  );
}
