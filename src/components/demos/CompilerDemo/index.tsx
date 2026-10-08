'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Search, Star } from 'lucide-react';
import { products, type Product } from '../../../constants/products';
import styles from './index.module.scss';

type SortMode = 'recommended' | 'price-low' | 'price-high' | 'rating';
const priceLimit =
  Math.ceil(Math.max(...products.map((product) => product.price)) / 500) * 500;

function ProductResults({
  items,
  compared,
  favorites,
  onCompare,
  onFavorite,
}: {
  items: Product[];
  compared: string[];
  favorites: string[];
  onCompare: (id: string) => void;
  onFavorite: (id: string) => void;
}) {
  return (
    <div className={styles['product-results']}>
      <div className={styles['result-heading']}>
        筛选结果 <span>{items.length} 项</span>
      </div>
      {items.length ? (
        items.map((product) => {
          const selected = compared.includes(product.id);
          const favorite = favorites.includes(product.id);
          return (
            <div className={styles['product-row']} key={product.id}>
              <span className={styles['product-icon']} aria-hidden="true">
                {product.category === '设备'
                  ? '⌘'
                  : product.category === '图书'
                    ? '▤'
                    : '▶'}
              </span>
              <span className={styles['product-copy']}>
                <strong>{product.name}</strong>
                <small>
                  {product.category} · ★ {product.rating} ·{' '}
                  {product.stock ? `库存 ${product.stock}` : '缺货'}
                </small>
              </span>
              <b>¥ {product.price}</b>
              <button
                type="button"
                className={[
                  styles['favorite-button'],
                  favorite && styles['is-favorite'],
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={`${favorite ? '取消收藏' : '收藏'}${product.name}`}
                title={favorite ? '取消收藏' : '收藏'}
                aria-pressed={favorite}
                onClick={() => onFavorite(product.id)}
              >
                <Star size={16} fill={favorite ? 'currentColor' : 'none'} />
              </button>
              <label className={styles['compare-check']}>
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={!selected && compared.length >= 3}
                  onChange={() => onCompare(product.id)}
                />
                对比
              </label>
            </div>
          );
        })
      ) : (
        <p className={styles['empty-state']}>
          没有匹配的商品，请调整筛选条件。
        </p>
      )}
    </div>
  );
}

export function CompilerDemo() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [sort, setSort] = useState<SortMode>('recommended');
  const [stockOnly, setStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(priceLimit);
  const [compared, setCompared] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [clicks, setClicks] = useState(0);

  const filtered = products
    .filter(
      (product) =>
        (category === '全部' || product.category === category) &&
        product.name.toLowerCase().includes(query.trim().toLowerCase()) &&
        product.price <= maxPrice &&
        (!stockOnly || product.stock > 0),
    )
    .sort((left, right) => {
      if (sort === 'price-low') return left.price - right.price;
      if (sort === 'price-high') return right.price - left.price;
      if (sort === 'rating') return right.rating - left.rating;
      return 0;
    });
  const comparison = products.filter((product) =>
    compared.includes(product.id),
  );

  function toggleValue(
    id: string,
    values: string[],
    update: (next: string[]) => void,
  ) {
    update(
      values.includes(id)
        ? values.filter((value) => value !== id)
        : [...values, id],
    );
  }

  return (
    <div className={[styles['surface'], styles['demo-surface']].join(' ')}>
      <div className={styles['demo-toolbar']}>
        <div className={styles['search-field']}>
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索商品..."
            aria-label="搜索商品"
          />
        </div>
        <div className={styles['select-wrap']}>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="商品分类"
          >
            <option>全部</option>
            <option>设备</option>
            <option>图书</option>
            <option>课程</option>
          </select>
          <ChevronDown size={16} />
        </div>
        <div className={styles['select-wrap']}>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            aria-label="排序方式"
          >
            <option value="recommended">默认排序</option>
            <option value="price-low">价格从低到高</option>
            <option value="price-high">价格从高到低</option>
            <option value="rating">评分优先</option>
          </select>
          <ChevronDown size={16} />
        </div>
      </div>
      <div className={styles['filter-line']}>
        <label className={styles['price-filter']}>
          价格上限{' '}
          <input
            type="range"
            min="0"
            max={priceLimit}
            step="50"
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
          />
          <strong>¥ {maxPrice}</strong>
        </label>
        <label className={styles['stock-filter']}>
          <input
            type="checkbox"
            checked={stockOnly}
            onChange={(event) => setStockOnly(event.target.checked)}
          />
          仅看有货
        </label>
      </div>
      <div className={styles['compiler-layout']}>
        <ProductResults
          items={filtered}
          compared={compared}
          favorites={favorites}
          onCompare={(id) => toggleValue(id, compared, setCompared)}
          onFavorite={(id) => toggleValue(id, favorites, setFavorites)}
        />
        <div className={styles['counter-panel']}>
          <span className={styles['micro-label']}>独立状态</span>
          <strong>{clicks}</strong>
          <p>
            改变这里的计数，不会改变筛选输入。用 React DevTools Profiler
            对照商品列表的提交记录。
          </p>
          <button
            className={styles['secondary-button']}
            onClick={() => setClicks((value) => value + 1)}
          >
            <Plus size={16} /> 增加计数
          </button>
          <div className={styles['selection-summary']}>
            收藏 {favorites.length} 项 · 对比 {compared.length}/3 项
          </div>
        </div>
      </div>
      <div className={styles['comparison']}>
        <div className={styles['result-heading']}>
          商品对比 <span>最多选择 3 项</span>
        </div>
        {comparison.length ? (
          <div className={styles['comparison-grid']}>
            {comparison.map((product) => (
              <div key={product.id}>
                <strong>{product.name}</strong>
                <span>¥ {product.price}</span>
                <span>评分 {product.rating}</span>
                <span>{product.stock ? `库存 ${product.stock}` : '缺货'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles['empty-state']}>
            勾选商品后在这里比较价格、评分和库存。
          </p>
        )}
      </div>
    </div>
  );
}
