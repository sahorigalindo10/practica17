// Esta pantalla permite acceder al formulario de inicio de sesión.
// El transformador JSX actual no requiere importar React para escribir JSX.
import { useNavigate } from 'react-router-dom';

const Inicio = () => {
  const navigate = useNavigate();
  //se pone UseNavigate para poder redirigir a la pantalla de login cuando se haga click en el boton de iniciar sesion

  const handleLoginClick = () => {
    //se pone handleLoginClick para que cuando se haga click en el boton de iniciar sesion se redirija a la pantalla de login
    navigate('/login');
  };

  return (
    <div>
      <h1>Bienvenido</h1>
      <button onClick={handleLoginClick}>Iniciar sesión</button>
    </div>
  );
};

export default Inicio;