import { useEffect, useState } from 'react'
import './pokemons.css'

// La URL base se usa para consultar tanto el listado como el detalle de cada Pokémon.
const API_URL = 'https://pokeapi.co/api/v2/pokemon'
// Define cuántos Pokémon se solicitan en cada página del catálogo.
const PAGE_SIZE = 20

// Consulta el detalle de un Pokémon y convierte la respuesta HTTP a un objeto JavaScript.
async function getPokemonDetails(url, signal) {
  const response = await fetch(url, { signal })

  // Se informa el error para que el componente pueda mostrarlo en pantalla.
  if (!response.ok) {
    throw new Error('No se pudieron cargar los datos de Pokémon.')
  }

  return response.json()
}

function Pokemons() {
  // Estos estados guardan los resultados, la búsqueda, la página y el estado de la petición.
  const [pokemon, setPokemon] = useState([])
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [requestVersion, setRequestVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Permite cancelar la petición anterior si cambia la búsqueda o la página.
    const controller = new AbortController()

    async function loadPokemon() {
      setIsLoading(true)
      setError('')

      try {
        if (activeSearch) {
          // Si hay una búsqueda, consulta directamente usando el nombre o número ingresado.
          const details = await getPokemonDetails(
            `${API_URL}/${encodeURIComponent(activeSearch.toLowerCase())}`,
            controller.signal,
          )
          setPokemon([details])
          return
        }

        // El listado entrega URLs; luego se consulta cada una para obtener imagen, tipos y medidas.
        const response = await fetch(
          `${API_URL}?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('No se pudo cargar la lista de Pokémon.')
        }

        const data = await response.json()
        // Se guarda el total para desactivar "Siguiente" al llegar al final del catálogo.
        setTotalCount(data.count)
        const details = await Promise.all(
          data.results.map((item) =>
            getPokemonDetails(item.url, controller.signal),
          ),
        )
        setPokemon(details)
      } catch (loadError) {
        // Las cancelaciones son normales al cambiar de página; los demás errores se muestran.
        if (loadError.name !== 'AbortError') {
          setError(
            loadError.message === 'Failed to fetch'
              ? 'No hay conexión con PokéAPI. Revisa tu conexión e inténtalo de nuevo.'
              : loadError.message,
          )
          setPokemon([])
        }
      } finally {
        // No se cambia el indicador de carga si esta petición ya fue cancelada.
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadPokemon()
    return () => controller.abort()
  }, [activeSearch, page, requestVersion])

  // Evita que el formulario recargue la página y activa la búsqueda ingresada.
  function handleSearch(event) {
    event.preventDefault()
    setPage(0)
    setActiveSearch(searchInput.trim())
  }

  // Restablece el formulario y vuelve a mostrar el listado paginado.
  function clearSearch() {
    setSearchInput('')
    setActiveSearch('')
    setPage(0)
  }

  return (
    <main className="pokedex">
      <header className="pokedex__header">
        <p className="pokedex__eyebrow">Pokédex</p>
        <h1>Explora el mundo Pokémon</h1>
        <p className="pokedex__intro">
          Busca tu Pokémon favorito o descubre los que aparecen en cada página.
        </p>

        <form className="pokedex__search" onSubmit={handleSearch}>
          <label className="visually-hidden" htmlFor="pokemon-search">
            Buscar por nombre o número
          </label>
          <input
            id="pokemon-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Ej. pikachu o 25"
          />
          <button type="submit">Buscar</button>
          {activeSearch && (
            <button
              className="pokedex__clear"
              type="button"
              onClick={clearSearch}
            >
              Ver todos
            </button>
          )}
        </form>
      </header>

      {isLoading && (
        <p className="pokedex__status" role="status">
          Cargando Pokémon...
        </p>
      )}

      {!isLoading && error && (
        <div className="pokedex__message" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRequestVersion((version) => version + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && pokemon.length === 0 && (
        <p className="pokedex__status">No se encontró ese Pokémon.</p>
      )}

      {!isLoading && !error && pokemon.length > 0 && (
        <>
          {/* Cada tarjeta presenta los datos del detalle devuelto por PokéAPI. */}
          <section className="pokemon-grid" aria-label="Lista de Pokémon">
            {pokemon.map((item) => (
              <article className="pokemon-card" key={item.id}>
                <div className="pokemon-card__image">
                  <img
                    src={
                      // Prefiere la ilustración oficial y usa la imagen normal como alternativa.
                      item.sprites.other['official-artwork'].front_default ||
                      item.sprites.front_default
                    }
                    alt={`Ilustración de ${item.name}`}
                    loading="lazy"
                  />
                </div>
                <div className="pokemon-card__details">
                  <span className="pokemon-card__number">
                    #{String(item.id).padStart(3, '0')}
                  </span>
                  <h2>{item.name}</h2>
                  <div className="pokemon-card__types">
                    {item.types.map(({ type }) => (
                      <span className="pokemon-type" key={type.name}>
                        {type.name}
                      </span>
                    ))}
                  </div>
                  <p className="pokemon-card__measurements">
                    {/* La API entrega altura y peso en hectómetros y hectogramos. */}
                    Altura: {(item.height / 10).toFixed(1)} m · Peso:{' '}
                    {(item.weight / 10).toFixed(1)} kg
                  </p>
                </div>
              </article>
            ))}
          </section>

          {!activeSearch && (
            //activeSearch se usa para que la navegación aparezca solo en el listado, porque la búsqueda devuelve un Pokémon.
            // La navegación aparece solo en el listado, porque la búsqueda devuelve un Pokémon.
            <nav className="pokedex__pagination" aria-label="Paginación">
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage - 1)}
                disabled={page === 0 || isLoading}
              >
                Anterior
              </button>
              <span>Página {page + 1}</span>
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={isLoading || (page + 1) * PAGE_SIZE >= totalCount}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}

export default Pokemons
