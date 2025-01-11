import { Button } from '@/components/ui/button';
import { type Recipe } from '@/db/schema/schema';

export const ShareButton = ({ recipe }: { recipe: Recipe }) => {
  const shareRecipe = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url: `${window.location.origin}/recipes/${recipe.id}`,
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      alert('Web Share API not supported in this browser.');
    }
  };

  return (
    <Button
      onClick={shareRecipe}
      className='bg-navyBlue text-antiWhite mb-4 ml-4'
    >
      Share Recipe
    </Button>
  );
};
